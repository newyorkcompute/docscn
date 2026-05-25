'use client';

import Link from 'next/link';
import { Button } from '@docscn/ui';
import { authClient } from '../lib/auth-client';
import { UserMenu } from './user-menu';

function SiteHeaderAuthFallback() {
  return (
    <Button aria-hidden className="invisible" size="sm" variant="outline">
      Sign in
    </Button>
  );
}

export function SiteHeaderAuth() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <SiteHeaderAuthFallback />;
  }

  if (session) {
    return <UserMenu email={session.user.email} name={session.user.name} />;
  }

  return (
    <Button asChild size="sm" variant="outline">
      <Link href="/sign-in">Sign in</Link>
    </Button>
  );
}
