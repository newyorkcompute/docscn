import Link from 'next/link';
import { Button, Shell } from '@docscn/ui';
import { getServerSession } from '../lib/session';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export async function SiteHeader() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <Shell className="flex items-center justify-between py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-primary/30 bg-primary/10 font-display text-lg text-primary transition group-hover:border-primary/50">
            <span className="relative z-10 font-semibold">d</span>
            <span className="absolute inset-0 bg-linear-to-br from-primary/20 to-transparent opacity-0 transition group-hover:opacity-100" />
          </span>
          <span className="font-mono text-sm tracking-[0.22em] text-foreground">
            docscn
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
            <Link href="/examples">Examples</Link>
          </Button>
          <ThemeToggle />
          {session ? (
            <UserMenu email={session.user.email} name={session.user.name} />
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </Shell>
    </header>
  );
}
