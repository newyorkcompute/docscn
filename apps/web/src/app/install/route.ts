const releaseRepository = 'newyorkcompute/docscn';

function shellSingleQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function buildInstallScript(origin: string) {
  const defaultHost = shellSingleQuote(origin);

  return `#!/usr/bin/env bash
set -euo pipefail

repo="\${DOCSCN_RELEASE_REPOSITORY:-${releaseRepository}}"
version="\${DOCSCN_VERSION:-latest}"
install_dir="\${DOCSCN_INSTALL_DIR:-$HOME/.local/bin}"
default_host=${defaultHost}
host="\${DOCSCN_URL:-$default_host}"

info() {
  printf '\\033[1;34m%s\\033[0m\\n' "$1"
}

fail() {
  printf '\\033[1;31merror:\\033[0m %s\\n' "$1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

detect_platform() {
  case "$(uname -s)" in
    Darwin) printf 'darwin' ;;
    Linux) printf 'linux' ;;
    *) fail "Unsupported operating system: $(uname -s)" ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    arm64|aarch64) printf 'arm64' ;;
    x86_64|amd64) printf 'x64' ;;
    *) fail "Unsupported CPU architecture: $(uname -m)" ;;
  esac
}

download() {
  url="$1"
  output="$2"

  if command_exists curl; then
    curl -fsSL "$url" -o "$output"
    return
  fi

  if command_exists wget; then
    wget -q "$url" -O "$output"
    return
  fi

  fail "curl or wget is required to download docscn."
}

verify_checksum() {
  binary_path="$1"
  asset_name="$2"
  sums_path="$3"

  [ -f "$sums_path" ] || return 0

  expected="$(grep "  $asset_name$" "$sums_path" | awk '{print $1}' || true)"
  [ -n "$expected" ] || return 0

  if command_exists sha256sum; then
    actual="$(sha256sum "$binary_path" | awk '{print $1}')"
  elif command_exists shasum; then
    actual="$(shasum -a 256 "$binary_path" | awk '{print $1}')"
  else
    info "Skipping checksum verification because sha256sum/shasum is unavailable"
    return 0
  fi

  [ "$actual" = "$expected" ] || fail "Checksum verification failed for $asset_name"
}

platform="$(detect_platform)"
arch="$(detect_arch)"
asset="docscn-$platform-$arch"

if [ "$version" = "latest" ]; then
  release_url="https://github.com/$repo/releases/latest/download"
else
  release_url="https://github.com/$repo/releases/download/$version"
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

info "Installing docscn CLI for $platform/$arch"

download "$release_url/$asset" "$tmp_dir/docscn"
download "$release_url/SHA256SUMS" "$tmp_dir/SHA256SUMS" || true
verify_checksum "$tmp_dir/docscn" "$asset" "$tmp_dir/SHA256SUMS"

chmod +x "$tmp_dir/docscn"
mkdir -p "$install_dir"
mv "$tmp_dir/docscn" "$install_dir/docscn"

installed_version="$("$install_dir/docscn" --version 2>/dev/null || true)"

if [ -n "$installed_version" ]; then
  info "Installed $installed_version"
else
  info "Installed docscn"
fi

case ":$PATH:" in
  *":$install_dir:"*) ;;
  *)
    printf '\\n%s\\n' "Add docscn to your PATH:"
    printf '  export PATH="%s:$PATH"\\n' "$install_dir"
    ;;
esac

cat <<NEXT

Next steps:
  docscn template list
  docscn template get minimal --output artifact.html
  docscn publish artifact.html --host $host

Run this when you want ownership, comments, revisions, private sharing, or API keys:
  docscn login --host $host

To update later, rerun this installer.
NEXT
`;
}

export function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return new Response(buildInstallScript(origin), {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-disposition': 'inline; filename="install.sh"',
      'content-type': 'text/x-shellscript; charset=utf-8',
    },
  });
}
