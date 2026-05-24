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
import { listArtifacts } from '@docscn/db';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { exampleArtifacts } from '../lib/example-artifacts';
import { getGalleryArtifactHref } from '../lib/gallery-artifacts';
import { getServerSession } from '../lib/session';
import { getRequestOrigin } from '../lib/request-origin';
import { SiteHeader } from '../components/site-header';
import { TerminalCommand } from '../components/terminal-command';

export const dynamic = 'force-dynamic';

const featuredExamples = exampleArtifacts.slice(0, 4);

const githubRepo = 'https://github.com/newyorkcompute/docscn';

export default async function Index() {
  const session = await getServerSession();
  const artifacts = await listArtifacts({ viewerUserId: session?.user.id });
  const origin = await getRequestOrigin();
  const installCommand = `curl ${origin}/install -fsS | bash`;
  const publishCommand = `docscn publish artifact.html --host ${origin}`;
  const hasLiveArtifacts = artifacts.length > 0;

  const agentIntegrations = [
    {
      title: 'Agent skills',
      body: 'Teach agents how to publish, read feedback, and revise.',
      href: `${origin}/skills.md`,
      label: '/skills.md',
      Icon: BookOpenText,
    },
    {
      title: 'REST + OpenAPI',
      body: 'Automate artifacts, threads, comments, and feedback bundles.',
      href: `${origin}/openapi.json`,
      label: 'openapi.json',
      Icon: Braces,
    },
    {
      title: 'MCP server',
      body: 'Expose publish, feedback, and revision tools to MCP hosts.',
      href: `${githubRepo}/blob/main/docs/mcp.md`,
      label: 'docs/mcp.md',
      Icon: PlugZap,
    },
    {
      title: 'CLI binary',
      body: 'Install once, then publish from local agent workflows.',
      href: `${githubRepo}/releases`,
      label: 'GitHub Releases',
      Icon: PackageCheck,
    },
    {
      title: 'Self-hosting',
      body: 'Run docscn with Postgres and S3-compatible storage.',
      href: `${githubRepo}/blob/main/docs/self-hosting.md`,
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
          <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-glow/20 blur-3xl animate-drift" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <Shell className="relative grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:py-20">
            <section>
              <Badge className="animate-fade-up" tone="outline">
                no-login publish / localhost-first / agent-native
              </Badge>
              <h1 className="animate-fade-up delay-1 mt-6 font-display text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[2.75rem] md:text-6xl xl:text-7xl">
                Host, share, and collaborate on AI-generated HTML artifacts.
              </h1>
              <p className="animate-fade-up delay-2 mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Publish AI-generated HTML to stable URLs without an account.
                Sign in when you want comments, revisions, private sharing, and
                analytics.
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
              <TerminalCommand
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
                    ['Publish', 'unlisted URL for a self-contained HTML artifact'],
                    ['Review', 'point, text, and element feedback on the render'],
                    ['Revise', 'structured threads returned to the next agent run'],
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

        <Shell className="py-4 pb-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>artifact examples</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Built for AI-native work surfaces.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                {hasLiveArtifacts
                  ? 'Recently published artifacts from this instance.'
                  : 'Starter demos open in the full artifact workspace. Your published artifacts replace them here.'}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/examples">
                {hasLiveArtifacts ? 'View gallery' : 'Browse all examples'}{' '}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {hasLiveArtifacts
              ? artifacts.map((artifact) => (
                  <Link href={`/artifacts/${artifact.slug}`} key={artifact.id}>
                    <Card className="feature-card group h-full p-5">
                      <PanelsTopLeft className="h-5 w-5 text-primary" />
                      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                        {artifact.metadata.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {artifact.metadata.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Badge tone="muted">{artifact.metadata.kind}</Badge>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                      </div>
                    </Card>
                  </Link>
                ))
              : featuredExamples.map((example) => (
                  <Link href={getGalleryArtifactHref(example.id)} key={example.id}>
                    <Card className="feature-card group h-full p-5">
                      <div className="flex items-start justify-between gap-3">
                        <PanelsTopLeft className="h-5 w-5 text-primary" />
                        <Badge tone="outline">Starter demo</Badge>
                      </div>
                      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                        {example.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {example.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <Badge tone="muted">{example.kind}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition group-hover:text-primary">
                          Open artifact
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>

          {!hasLiveArtifacts ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Ready to make one yours?{' '}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="/dashboard"
              >
                Open workspace
              </Link>
            </p>
          ) : null}
        </Shell>

        <Shell className="pb-24">
          <Card className="feature-card relative overflow-hidden grid gap-8 p-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
            <div>
              <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <Bot className="h-6 w-6 text-primary" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Ready for MCP, skills, APIs, and CLI publishing.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Point agents at skills, OpenAPI, or MCP — then close the loop
                with structured review feedback and revised HTML uploads.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {agentIntegrations.map((item) => (
                <Link
                  className="group rounded-xl border border-border/80 bg-secondary/20 p-4 transition hover:border-primary/35 hover:bg-secondary/35"
                  href={item.href}
                  key={item.label}
                  rel={
                    item.href.startsWith('http') && !item.href.startsWith(origin)
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  target={
                    item.href.startsWith('http') && !item.href.startsWith(origin)
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
