import { cn } from '@docscn/ui';

export function ArtifactFrame({
  html,
  title,
  className,
}: {
  html: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-black shadow-2xl shadow-black/40',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary/70 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-muted-foreground/35" />
        <span className="h-3 w-3 rounded-full bg-muted-foreground/25" />
        <span className="h-3 w-3 rounded-full bg-muted-foreground/15" />
        <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
          sandboxed artifact / {title}
        </span>
      </div>
      <iframe
        className="h-[680px] w-full bg-white"
        sandbox="allow-scripts allow-forms"
        srcDoc={html}
        title={title}
      />
    </div>
  );
}
