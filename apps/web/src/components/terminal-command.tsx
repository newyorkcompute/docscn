'use client';

import { Terminal } from 'lucide-react';
import { cn } from '@docscn/ui';
import { CopyCommandButton } from './copy-command-button';

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
    <div
      className={cn(
        'terminal-block rounded-xl border border-border p-3 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          {label}
        </div>
        <CopyCommandButton command={command} label={copyLabel} />
      </div>
      <pre className="overflow-x-auto pt-3 font-mono text-xs leading-6 text-foreground sm:text-sm">
        <code>{command}</code>
      </pre>
    </div>
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
