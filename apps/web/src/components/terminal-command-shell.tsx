import type { ReactNode } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '@docscn/ui';

export function TerminalCommandShell({
  label,
  command,
  className,
  actions,
}: {
  label: string;
  command: string;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'terminal-block rounded-xl border border-border p-3 shadow-sm',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 border-b border-border/80 pb-3',
          actions ? 'justify-between' : 'gap-2',
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {label}
        </div>
        {actions}
      </div>
      <pre className="overflow-x-auto pt-3 font-mono text-xs leading-6 text-foreground sm:text-sm">
        <code>{command}</code>
      </pre>
    </div>
  );
}
