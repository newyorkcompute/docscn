import type { ReactNode } from 'react';
import { cn, Eyebrow } from '@docscn/ui';

export function AppPageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow: string;
  title: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-5 md:flex-row md:items-end',
        className,
      )}
    >
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>
      ) : null}
    </div>
  );
}
