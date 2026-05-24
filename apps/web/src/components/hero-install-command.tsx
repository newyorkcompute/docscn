import { Terminal } from 'lucide-react';
import { cn } from '@docscn/ui';

export function HeroInstallCommand({
  label,
  command,
  className,
}: {
  label: string;
  command: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'terminal-block rounded-xl border border-border p-3 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/80 pb-3 text-xs text-muted-foreground">
        <Terminal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </div>
      <pre className="overflow-x-auto pt-3 font-mono text-xs leading-6 text-foreground sm:text-sm">
        <code>{command}</code>
      </pre>
    </div>
  );
}
