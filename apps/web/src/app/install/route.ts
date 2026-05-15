const minNodeMajor = 20;
const npmPackageName = 'docscn';

function buildInstallScript(origin: string) {
  return `#!/usr/bin/env bash
set -euo pipefail

package_name="\${DOCSCN_INSTALL_PACKAGE:-${npmPackageName}}"
min_node_major="${minNodeMajor}"

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

node_major_version() {
  node -p "Number(process.versions.node.split('.')[0])"
}

info "Installing docscn CLI"

command_exists node || fail "Node.js ${minNodeMajor}+ is required. Install Node, then rerun: curl ${origin}/install -fsS | bash"
command_exists npm || fail "npm is required. Install npm, then rerun: curl ${origin}/install -fsS | bash"

current_node_major="$(node_major_version)"

if [ "$current_node_major" -lt "$min_node_major" ]; then
  fail "Node.js ${minNodeMajor}+ is required. Current version: $(node --version)"
fi

info "Installing $package_name with npm"
npm install -g "$package_name"

if ! command_exists docscn; then
  fail "docscn was installed, but the docscn binary is not on PATH. Check your npm global bin directory."
fi

installed_version="$(docscn --version 2>/dev/null || true)"

if [ -n "$installed_version" ]; then
  info "Installed $installed_version"
else
  info "Installed docscn"
fi

cat <<'NEXT'

Next steps:
  docscn login
  docscn publish artifact.html

To update later, rerun this installer or run:
  npm update -g docscn
NEXT
`;
}

export function GET(request: Request) {
  return new Response(buildInstallScript(new URL(request.url).origin), {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-disposition': 'inline; filename="install.sh"',
      'content-type': 'text/x-shellscript; charset=utf-8',
    },
  });
}
