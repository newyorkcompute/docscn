'use client';

import { CopyCommandButton } from './copy-command-button';
import { TerminalCommandShell } from './terminal-command-shell';

export function TerminalCommand({
  label,
  command,
  className,
  copyLabel = 'Copy',
}: {
  label: string;
  command: string;
  className?: string;
  copyLabel?: string;
}) {
  return (
    <TerminalCommandShell
      actions={<CopyCommandButton command={command} label={copyLabel} />}
      className={className}
      command={command}
      label={label}
    />
  );
}
