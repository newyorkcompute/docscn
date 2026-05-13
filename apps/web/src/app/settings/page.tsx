import Link from 'next/link';
import { listApiKeys } from '@docscn/db';
import { Badge, Button, Card, Shell } from '@docscn/ui';
import { getServerSession } from '../../lib/session';
import { ApiKeysClient } from '../../components/api-keys-client';
import { SiteHeader } from '../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main>
        {session ? (
          <Shell className="py-12">
            <div className="mx-auto grid max-w-4xl gap-8">
              <div>
                <Badge tone="outline">workspace settings</Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                  Settings
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage account basics and publishing credentials. This page
                  will become the home for future self-hosted workspace
                  settings.
                </p>
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-semibold">Account</h2>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{session.user.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{session.user.email}</span>
                  </div>
                </div>
              </Card>

              <ApiKeysClient apiKeys={await listApiKeys(session.user.id)} />
            </div>
          </Shell>
        ) : (
          <Shell className="py-16">
            <Card className="mx-auto max-w-xl p-8 text-center">
              <h1 className="text-2xl font-semibold">
                Sign in to view settings
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Settings include account details and API keys that publish
                artifacts on your behalf.
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
