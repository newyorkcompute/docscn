import Link from 'next/link';
import { listApiKeys } from '@docscn/db';
import { Button, Card, Shell } from '@docscn/ui';
import { getServerSession } from '../../../lib/session';
import { ApiKeysClient } from '../../../components/api-keys-client';
import { SiteHeader } from '../../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main>
        {session ? (
          <ApiKeysClient apiKeys={await listApiKeys(session.user.id)} />
        ) : (
          <Shell className="py-16">
            <Card className="mx-auto max-w-xl p-8 text-center">
              <h1 className="text-2xl font-semibold">Sign in to manage keys</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                API keys publish artifacts on behalf of your account, so they
                require an authenticated owner.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            </Card>
          </Shell>
        )}
      </main>
    </>
  );
}
