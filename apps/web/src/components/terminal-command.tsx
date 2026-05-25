'use client';

import { cn } from '@docscn/ui';
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

export function CommandSnippet({
  command,
  className,
  copyLabel = 'Copy',
}: {
  command: string;
  className?: string;
  copyLabel?: string;
}) {
  return (
    <div
      className={cn(
        'terminal-block flex items-start justify-between gap-3 rounded-lg border border-border p-3',
        className,
      )}
    >
      <code className="min-w-0 flex-1 font-mono text-xs leading-6 text-foreground">
        {command}
      </code>
      <CopyCommandButton command={command} label={copyLabel} />
    </div>
  );
}
