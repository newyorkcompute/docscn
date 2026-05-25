import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Bot,
  Braces,
  Code2,
  Download,
  MessageSquare,
  PackageCheck,
  PanelsTopLeft,
  PlugZap,
  RefreshCcw,
  Server,
} from 'lucide-react';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { GITHUB_REPO_URL } from '../lib/constants';
import { getAppOrigin } from '../lib/app-origin';
import { HomeGallerySection } from '../components/home-gallery-section';
import { TerminalCommandShell } from '../components/terminal-command-shell';
import { SiteHeader } from '../components/site-header';

export default function Index() {
  const origin = getAppOrigin();
  const installCommand = `curl ${origin}/install -fsS | bash`;
  const publishCommand = `docscn publish artifact.html --host ${origin}`;

  const agentIntegrations = [
    {
      title: 'Hosted workspace',
      body: 'Publish from the browser now; sign in later for ownership and review.',
      href: '/publish',
      label: 'Publish now',
      Icon: PanelsTopLeft,
    },
    {
      title: 'Agent instructions',
      body: 'Teach coding agents how to publish, read feedback, and revise.',
      href: `${origin}/skills.md`,
      label: '/skills.md',
      Icon: BookOpenText,
    },
    {
      title: 'API automation',
      body: 'Automate artifacts, threads, comments, and feedback bundles.',
      href: `${origin}/openapi.json`,
      label: 'openapi.json',
      Icon: Braces,
    },
    {
      title: 'MCP tools',
      body: 'Expose publish, feedback, and revision actions to MCP hosts.',
      href: `${GITHUB_REPO_URL}/blob/main/docs/mcp.md`,
      label: 'docs/mcp.md',
      Icon: PlugZap,
    },
    {
      title: 'Local publishing',
      body: 'Install once, then publish from local agent workflows and scripts.',
      href: `${GITHUB_REPO_URL}/releases`,
      label: 'GitHub Releases',
      Icon: PackageCheck,
    },
    {
      title: 'Self-hosting',
      body: 'Run your own instance with Postgres and S3-compatible storage.',
      href: `${GITHUB_REPO_URL}/blob/main/docs/self-hosting.md`,
      label: 'docs/self-hosting.md',
      Icon: Server,
    },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />

          <Shell className="relative grid gap-10 py-10 sm:py-14 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:py-16">
            <section>
              <Badge className="animate-fade-up" tone="outline">
                no-login publish / cloud or self-host / agent-native
              </Badge>
              <h1 className="mt-6 font-display text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[2.75rem] md:text-6xl xl:text-7xl">
                Host, share, and collaborate on AI-generated HTML artifacts.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Publish AI-generated HTML to stable URLs without an account. Use
                the hosted workspace or self-host with your own storage. Sign in
                when you want comments, revisions, ownership, and private
                sharing.
              </p>
              <div className="animate-fade-up delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/publish">
                    Publish now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="text-foreground/75 hover:text-foreground"
                  size="lg"
                  variant="ghost"
                >
                  <Link href="/examples">
                    See examples <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <TerminalCommandShell
                className="animate-fade-up delay-4 mt-10"
                command={installCommand}
                label="Get started in 30 seconds"
              />
            </section>

            <Card className="animate-fade-up delay-3 feature-card relative hidden overflow-hidden p-1.5 lg:block">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
              <div className="rounded-[0.65rem] border border-border/80 bg-secondary/30 p-5">
                <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-5">
                  <div>
                    <Eyebrow>
                      host {'->'} collaborate {'->'} revise
                    </Eyebrow>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                      Generated incident report
                    </p>
                  </div>
                  <Badge>v2</Badge>
                </div>
                <div className="grid gap-3 py-5">
                  {[
                    [
                      'Publish',
                      'unlisted URL for a self-contained HTML artifact',
                    ],
                    [
                      'Review',
                      'point, text, and element feedback on the render',
                    ],
                    [
                      'Revise',
                      'structured threads returned to the next agent run',
                    ],
                  ].map((item, index) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border border-border/80 bg-card/80 p-3.5"
                      key={item[0]}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6">
                        <strong className="text-foreground">{item[0]}</strong>
                        <span className="text-muted-foreground">
                          {' '}
                          {item[1]}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-dashed border-primary/35 bg-primary/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Download className="h-3.5 w-3.5" />
                    CLI quickstart
                  </div>
                  <p className="mt-3 font-mono text-xs leading-6 text-primary/90">
                    {installCommand}
                  </p>
                  <p className="mt-2 font-mono text-xs leading-6 text-primary/90">
                    {publishCommand}
                  </p>
                </div>
              </div>
            </Card>
          </Shell>
        </section>

        <Shell className="grid gap-5 py-14 md:grid-cols-3 md:gap-4 lg:py-16">
          {[
            [
              'Publishing, not notes',
              Code2,
              'Turn agent output into shareable HTML pages.',
            ],
            [
              'Collaborate like PRs/Figma',
              MessageSquare,
              'Pin feedback to points, text, and elements.',
            ],
            [
              'Revision loop',
              RefreshCcw,
              'Feed review threads back into the next revision.',
            ],
          ].map(([title, Icon, body]) => (
            <Card className="feature-card p-6 md:p-7" key={title as string}>
              <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight md:text-xl lg:text-2xl">
                {title as string}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:min-h-12">
                {body as string}
              </p>
            </Card>
          ))}
        </Shell>

        <HomeGallerySection />

        <Shell className="pb-24">
          <Card className="feature-card relative overflow-hidden grid gap-8 p-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
            <div>
              <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <Bot className="h-6 w-6 text-primary" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Use it from any agent workflow.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Publish from the browser, CLI, MCP, OpenAPI, or skills.md, then
                send structured review feedback back into the next run.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {agentIntegrations.map((item) => (
                <Link
                  className="group rounded-xl border border-border/80 bg-secondary/20 p-4 transition hover:border-primary/35 hover:bg-secondary/35"
                  href={item.href}
                  key={item.label}
                  rel={
                    item.href.startsWith('http') &&
                    !item.href.startsWith(origin)
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  target={
                    item.href.startsWith('http') &&
                    !item.href.startsWith(origin)
                      ? '_blank'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-md border border-primary/15 bg-primary/10 p-1.5">
                      <item.Icon className="h-4 w-4 text-primary" />
                    </span>
                    <p className="font-medium text-foreground transition group-hover:text-primary">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-primary">
                    {item.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </Shell>
      </main>
    </>
  );
}
