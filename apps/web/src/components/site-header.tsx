import Link from 'next/link';
import { Button, Shell } from '@docscn/ui';
import { getServerSession } from '../lib/session';
import { UserMenu } from './user-menu';

export async function SiteHeader() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <Shell className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/40 bg-primary/10 font-mono text-sm text-primary">
            d
          </span>
          <span className="font-mono text-sm tracking-[0.28em] text-foreground">
            docscn
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/dashboard" className="hover:text-foreground">
            dashboard
          </Link>
          <Link href="/publish" className="hover:text-foreground">
            publish
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <UserMenu email={session.user.email} name={session.user.name} />
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/publish">Publish artifact</Link>
          </Button>
        </div>
      </Shell>
    </header>
  );
}
