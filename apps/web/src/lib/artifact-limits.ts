export const artifactHtmlMaxBytes = 1024 * 1024;

export function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
