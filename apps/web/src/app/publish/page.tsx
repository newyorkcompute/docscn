import { getServerSession } from '../../lib/session';
import { getRequestOrigin } from '../../lib/request-origin';
import { AppPageHeader } from '../../components/app-page-header';
import { CopyCommandButton } from '../../components/copy-command-button';
import { SiteHeader } from '../../components/site-header';
import {
  ArrowRight,
  BookOpenText,
  KeyRound,
  TerminalSquare,
} from 'lucide-react';
import { Button, Card, Shell } from '@docscn/ui';

export default async function PublishPage() {
  const [session, origin] = await Promise.all([
    getServerSession(),
    getRequestOrigin(),
  ]);
  const installCommand = `curl ${origin}/install -fsS | bash`;
  const loginCommand = `docscn login --host ${origin}`;
  const templateCommand = `docscn template get html-effectiveness-code-approaches --output artifact.html`;
  const publishCommand = `docscn publish artifact.html --host ${origin}`;

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <Shell className="grid gap-8 py-10">
          <AppPageHeader
            actions={
              <>
                <Button asChild>
                  <a href="/skills.md">Open skills.md</a>
                </Button>
                <Button asChild variant="outline">
                  <a href={session ? '/settings/api-keys' : '/sign-in'}>
                    {session ? 'API keys' : 'Sign in'}
                  </a>
                </Button>
              </>
            }
            description="The primary docscn workflow is agent and CLI publishing. Use this page to install the CLI, point an agent at the right instructions, and publish a self-contained HTML file."
            eyebrow="agent publishing"
            title="Publish artifacts from your terminal."
          />

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="feature-card p-6 md:p-8">
              <div className="flex items-start gap-3">
                <TerminalSquare className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    CLI quickstart
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Install once, publish an unlisted artifact immediately, and
                    authenticate when you need ownership, comments, revisions,
                    private sharing, or automation keys.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  ['Install docscn', installCommand],
                  ['Copy a starter artifact', templateCommand],
                  ['Publish an HTML artifact', publishCommand],
                  ['Claim ownership when ready', loginCommand],
                ].map(([label, command]) => (
                  <div
                    className="grid gap-3 rounded-xl border border-border bg-background/45 p-3 md:grid-cols-[1fr_auto] md:items-center"
                    key={label}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </p>
                      <code className="mt-2 block overflow-x-auto font-mono text-xs text-foreground">
                        {command}
                      </code>
                    </div>
                    <CopyCommandButton command={command} label="Copy" />
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-5">
              <Card className="feature-card p-6">
                <BookOpenText className="h-5 w-5 text-primary" />
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                  Give agents the contract.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  `skills.md` tells agents how to publish, fetch feedback,
                  revise artifacts, resolve threads, and use starter templates.
                </p>
                <Button asChild className="mt-5" variant="outline">
                  <a href="/skills.md">
                    Open agent instructions <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </Card>

              <Card className="feature-card p-6">
                <KeyRound className="h-5 w-5 text-primary" />
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
                  Use API keys for automation.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Logged-in users can create API keys for headless agents,
                  scheduled jobs, and private publishing.
                </p>
                <Button asChild className="mt-5" variant="outline">
                  <a href={session ? '/settings/api-keys' : '/sign-in'}>
                    {session ? 'Manage API keys' : 'Sign in for API keys'}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </div>
          </div>
        </Shell>
      </main>
    </>
  );
}
