import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Braces,
  Code2,
  FileSearch,
  Layers,
  MessageSquare,
  MousePointerClick,
  PackageCheck,
  Palette,
  PanelsTopLeft,
  PlugZap,
  RefreshCcw,
  Server,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Button, Shell } from '@docscn/ui';
import { GITHUB_REPO_URL } from '../lib/constants';
import { getServerSession } from '../lib/session';
import { HomeHeader } from '../components/home-header';
import { HeroInstallTerminal } from '../components/hero-cli-commands';
import './home.css';

export default async function Index() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  const features = [
    {
      index: '01',
      title: 'Publish HTML',
      body: 'Publish a self-contained HTML artifact from the CLI, API, or MCP and get a stable URL.',
      Icon: Code2,
    },
    {
      index: '02',
      title: 'Review visually',
      body: 'Open the artifact as a page, then leave comments on the render instead of reviewing a screenshot.',
      Icon: MessageSquare,
    },
    {
      index: '03',
      title: 'Revise with feedback',
      body: 'Send structured review threads back to the next agent run so the artifact can improve.',
      Icon: RefreshCcw,
    },
  ];

  const agentIntegrations = [
    {
      title: 'Publishing guide',
      path: '/publish',
      body: 'Install the CLI, copy the publish command, and point agents at the right workflow.',
      Icon: PanelsTopLeft,
      recommended: true,
    },
    {
      title: 'Agent instructions',
      path: '/skills.md',
      body: 'Teach coding agents how to publish, read feedback, and revise.',
      Icon: BookOpenText,
      recommended: true,
    },
    {
      title: 'API automation',
      path: '/openapi.json',
      body: 'Automate artifacts, threads, comments, and feedback bundles.',
      Icon: Braces,
    },
    {
      title: 'MCP tools',
      path: `${GITHUB_REPO_URL}/blob/main/docs/mcp.md`,
      body: 'Expose publish, feedback, and revision actions to MCP hosts.',
      Icon: PlugZap,
    },
    {
      title: 'Local publishing',
      path: `${GITHUB_REPO_URL}/releases`,
      body: 'Install once, then publish from local agent workflows and scripts.',
      Icon: PackageCheck,
    },
    {
      title: 'Self-hosting',
      path: `${GITHUB_REPO_URL}/blob/main/docs/self-hosting.md`,
      body: 'Run your own instance with Postgres and S3-compatible storage.',
      Icon: Server,
    },
  ];

  return (
    <div className="home-page">
      <HomeHeader />
      <main>
        <section className="home-hero">
          <div
            aria-hidden="true"
            className="home-hero-grid pointer-events-none absolute inset-0"
          />

          <Shell className="relative grid gap-12 py-12 sm:py-16 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-20">
            <div className="home-rail absolute left-0 top-1/2 hidden -translate-y-1/2 lg:block">
              docscn · publish review revise
            </div>

            <section className="lg:pl-8">
              <p className="home-kicker home-reveal">
                publish {'->'} review {'->'} revise
              </p>
              <h1 className="home-headline home-reveal home-delay-1 mt-5">
                Publish, review,
                <br />
                and revise <em>AI HTML artifacts</em>
              </h1>
              <p className="home-lede home-reveal home-delay-2 mt-6">
                Give agent-generated HTML a stable URL, a visual review surface,
                and feedback the next agent run can act on.
              </p>

              <div className="home-stat-strip home-reveal home-delay-3 mt-7">
                <span className="home-stat">one permalink per artifact</span>
                <span className="home-stat">review in the browser</span>
                <span className="home-stat">agents read your feedback</span>
              </div>

              <div className="home-reveal home-delay-4 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/publish">
                    Publish with CLI <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="text-foreground/75 hover:text-foreground"
                  size="lg"
                  variant="ghost"
                >
                  <Link href="/skills.md">
                    Agent guide <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="text-foreground/75 hover:text-foreground"
                  size="lg"
                  variant="ghost"
                >
                  <Link href="/templates">
                    See examples <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>

            <aside
              aria-label="CLI install preview"
              className="home-sheet home-reveal home-delay-3"
            >
              <div className="home-sheet-inner p-5">
                <div className="border-b border-border/70 pb-5">
                  <div>
                    <p className="home-sheet-label">local agent workflow</p>
                    <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                      Install the CLI once.
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                      Then any agent, script, or terminal can publish a
                      self-contained HTML artifact to a stable review URL.
                    </p>
                  </div>
                </div>

                <HeroInstallTerminal className="home-terminal mt-5" />
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Publish without an account; sign in when you need ownership or
                  private sharing. Run{' '}
                  <code className="rounded-md border border-border bg-background/70 px-1.5 py-0.5 font-mono text-foreground">
                    docscn help
                  </code>{' '}
                  to see all commands.
                </p>
              </div>
            </aside>
          </Shell>
        </section>

        <Shell className="home-scroll-reveal py-16 lg:py-20">
          <div className="home-section-head mb-10 max-w-2xl">
            <p className="home-kicker">Core loop</p>
            <h2>A simple home for agent-generated HTML.</h2>
          </div>

          <div className="home-bento">
            {features.map((feature) => (
              <article
                className="home-bento-card home-scroll-reveal"
                data-index={feature.index}
                key={feature.index}
              >
                <span className="inline-flex rounded-md border border-primary/25 bg-primary/10 p-2">
                  <feature.Icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight lg:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </Shell>

        <Shell className="home-scroll-reveal pb-16">
          <aside className="home-html-note">
            <p className="home-kicker">Why HTML?</p>
            <p className="mt-4 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              Agents are producing rich, visual HTML instead of long markdown
              files.{' '}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html"
                rel="noopener noreferrer"
                target="_blank"
              >
                HTML is unreasonably effective
              </a>
              &mdash;docscn gives it a home.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  Icon: Layers,
                  title: 'Information density',
                  body: 'Tables, CSS, SVG, code snippets, and interactive elements in one file. Almost any information an agent can read, it can represent as HTML.',
                },
                {
                  Icon: FileSearch,
                  title: 'Visual clarity',
                  body: 'Nobody reads a 100-line markdown file. HTML lets agents organize information with tabs, illustrations, and navigation so you actually review it.',
                },
                {
                  Icon: Share2,
                  title: 'Ease of sharing',
                  body: 'Browsers render HTML natively. Share a link, not an attachment. The chance of someone reading your spec or report goes way up.',
                },
                {
                  Icon: SlidersHorizontal,
                  title: 'Two-way interactions',
                  body: 'Sliders, knobs, editable fields. HTML lets you interact with the document and copy changes back into the next agent prompt.',
                },
              ].map((item) => (
                <div
                  className="rounded-xl border border-border/50 bg-background/30 p-4"
                  key={item.title}
                >
                  <item.Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-display text-sm font-semibold tracking-tight">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Inspired by Thariq Shihipar&apos;s{' '}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html"
                rel="noopener noreferrer"
                target="_blank"
              >
                &ldquo;The unreasonable effectiveness of HTML&rdquo;
              </a>{' '}
              on the Claude Code blog.
            </p>
          </aside>
        </Shell>

        <Shell className="home-scroll-reveal pb-16">
          <div className="home-section-head mb-8 max-w-2xl">
            <p className="home-kicker">Use cases</p>
            <h2>What agents build as HTML.</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Every use case from the blog post has a matching starter template
              you can publish right now.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                Icon: Sparkles,
                title: 'Specs, planning & exploration',
                body: 'Brainstorm directions, compare approaches side by side, and write implementation plans with mockups and data flow diagrams.',
                href: '/templates',
              },
              {
                Icon: Code2,
                title: 'Code review & understanding',
                body: 'Render diffs with margin annotations, color-code findings by severity, and map module architecture as spatial diagrams.',
                href: '/templates',
              },
              {
                Icon: Palette,
                title: 'Design & prototypes',
                body: 'Sketch design systems, tune animations with sliders, and prototype clickable flows — all in the medium they ship in.',
                href: '/templates',
              },
              {
                Icon: FileSearch,
                title: 'Reports, research & learning',
                body: 'Synthesize status reports, incident timelines, concept explainers, and slide decks agents can generate from your data sources.',
                href: '/templates',
              },
              {
                Icon: MousePointerClick,
                title: 'Custom editing interfaces',
                body: 'Draggable triage boards, feature flag editors, prompt tuners — throwaway UIs purpose-built for one piece of data, with a copy button at the end.',
                href: '/templates',
              },
            ].map((useCase) => (
              <Link
                className="home-bento-card home-scroll-reveal group"
                href={useCase.href}
                key={useCase.title}
              >
                <span className="inline-flex rounded-md border border-primary/25 bg-primary/10 p-2">
                  <useCase.Icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                  {useCase.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {useCase.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-primary">
                  Browse templates{' '}
                  <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Shell>

        <Shell className="home-scroll-reveal pb-24 pt-4">
          <div className="home-section-head mb-8 max-w-xl">
            <p className="home-kicker">Publishing paths</p>
            <h2>Use the CLI, API, or MCP.</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Start with the CLI guide, then wire docscn into agent workflows
              with OpenAPI, MCP, and skills.md.
            </p>
          </div>

          <div className="home-manifest">
            <div className="home-manifest-header">Ways to publish</div>
            <div className="home-manifest-grid">
              {agentIntegrations.map((item) => (
                <Link
                  className={`home-manifest-link group${
                    'recommended' in item && item.recommended
                      ? ' home-manifest-recommended'
                      : ''
                  }`}
                  href={item.path}
                  key={item.path}
                  rel={
                    item.path.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  target={item.path.startsWith('http') ? '_blank' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-md border border-primary/15 bg-primary/10 p-1.5">
                      <item.Icon className="h-4 w-4 text-primary" />
                    </span>
                    <p className="font-medium text-foreground transition group-hover:text-primary">
                      {item.title}
                    </p>
                    {'recommended' in item && item.recommended && (
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-primary">
                        start here
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                  <span className="home-manifest-path mt-3 inline-flex items-center gap-1">
                    {item.path.startsWith('http')
                      ? item.path.replace(GITHUB_REPO_URL, 'github.com/…')
                      : item.path}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="home-cta-band home-scroll-reveal mt-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight">
                Ready to publish your first artifact?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Copy the CLI command and get a stable review URL in seconds.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/publish">
                Open publishing guide <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Shell>
      </main>
      <footer className="home-footer">
        <Shell className="py-6">
          <a
            className="home-footer-link"
            href="https://x.com/siddharthkul"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="home-footer-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.9 2.25h3.68l-8.04 9.19L24 21.75h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 2.25h7.6l5.24 6.93 6.06-6.93Zm-1.29 17.68h2.04L6.5 3.98H4.31l13.3 15.95Z" />
            </svg>
            made by siddharthkul
          </a>
        </Shell>
      </footer>
    </div>
  );
}
