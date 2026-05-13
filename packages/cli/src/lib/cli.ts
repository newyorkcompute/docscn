export const futureCommands = [
  'publish',
  'login',
  'pull',
  'revisions',
  'comments',
  'export',
] as const;

export type DocscnCommand = (typeof futureCommands)[number];

export function getCliHelp() {
  return `docscn

Future CLI for publishing and automating agent-generated HTML artifacts.

Planned:
  npx docscn publish artifact.html
  docscn login
  docscn pull
  docscn revisions
  docscn comments
  docscn export`;
}
