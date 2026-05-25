'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@docscn/ui';
import { authClient } from '../lib/auth-client';

interface UserMenuProps {
  email?: string | null;
  name?: string | null;
}

function getInitial(name?: string | null, email?: string | null) {
  return (name ?? email ?? 'u').trim().charAt(0).toLowerCase() || 'u';
}

export function UserMenu({ email, name }: UserMenuProps) {
  const router = useRouter();

  return (
    <details className="group relative">
      <summary className="app-field flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
          {getInitial(name, email)}
        </span>
        <span className="hidden max-w-32 truncate text-muted-foreground sm:inline">
          {name ?? email}
        </span>
      </summary>
      <div className="app-popover absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl p-1 text-popover-foreground">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">{name ?? 'Signed in'}</p>
          {email ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </div>
        <div className="my-1 h-px bg-border" />
        <Link
          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          href="/dashboard"
        >
          Dashboard
        </Link>
        <Link
          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          href="/settings"
        >
          Settings
        </Link>
        <Button
          className="h-auto w-full justify-start rounded-lg px-3 py-2 text-sm font-normal text-muted-foreground"
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push('/');
                  router.refresh();
                },
              },
            })
          }
          variant="ghost"
        >
          Sign out
        </Button>
      </div>
    </details>
  );
}
