export const defaultDocscnHost = 'https://docscn.ai';

export function parseFlagValue(args: string[], name: string) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

export function hasFlag(args: string[], name: string) {
  return args.includes(name);
}
