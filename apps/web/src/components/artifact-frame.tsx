import { cn } from '@docscn/ui';

export function ArtifactFrame({
  html,
  title,
  className,
  iframeClassName,
  showChrome = true,
}: {
  html: string;
  title: string;
  className?: string;
  iframeClassName?: string;
  showChrome?: boolean;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/4',
        className,
      )}
    >
      {showChrome ? (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/10" />
          <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
            sandboxed artifact / {title}
          </span>
        </div>
      ) : null}
      <iframe
        className={cn('h-[680px] w-full bg-white', iframeClassName)}
        sandbox="allow-scripts allow-forms"
        srcDoc={html}
        title={title}
      />
    </div>
  );
}
