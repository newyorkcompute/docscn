import Link from 'next/link';
import { listApiKeys } from '@docscn/db';
import { Button, Card, Shell } from '@docscn/ui';
import { getServerSession } from '../../lib/session';
import { ApiKeysClient } from '../../components/api-keys-client';
import { AppPageHeader } from '../../components/app-page-header';
import { SiteHeader } from '../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        {session ? (
          <Shell className="grid gap-8 py-10">
            <AppPageHeader
              description="Manage account basics and publishing credentials. This page will become the home for future self-hosted workspace settings."
              eyebrow="workspace settings"
              title="Settings"
            />

            <Card className="p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    Agent setup
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Point agents at the public skill file. They can run the CLI
                    login flow, save credentials locally, publish artifacts to
                    stable URLs, read feedback, comment, and submit revisions
                    without using the UI.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/skills.md">Open skills.md</Link>
                </Button>
              </div>
              <div className="app-code-panel mt-5 rounded-xl p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Agent prompt
                </p>
                <code className="mt-3 block text-sm leading-6 text-foreground">
                  Read /skills.md, install docscn from /install if needed, run
                  docscn login, and publish your self-contained HTML artifact.
                  Collaborators can review it visually from the artifact URL.
                </code>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Account
              </h2>
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
          </Shell>
        ) : (
          <Shell className="py-16">
            <Card className="mx-auto max-w-xl p-8 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
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
