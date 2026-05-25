import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
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
import { Button, Shell } from '@docscn/ui';
import { GITHUB_REPO_URL } from '../lib/constants';
import { HomeHeader } from '../components/home-header';
import {
  HeroCliQuickstartPreview,
  HeroInstallTerminal,
} from '../components/hero-cli-commands';
import { HomeGallerySection } from '../components/home-gallery-section';
import './home.css';

export default function Index() {
  const features = [
    {
      index: '01',
      title: 'Publish HTML',
      body: 'Upload a self-contained HTML artifact from the browser, CLI, API, or MCP and get a stable URL.',
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
      title: 'Hosted workspace',
      path: '/publish',
      body: 'Publish from the browser now; sign in later for ownership and review.',
      Icon: PanelsTopLeft,
    },
    {
      title: 'Agent instructions',
      path: '/skills.md',
      body: 'Teach coding agents how to publish, read feedback, and revise.',
      Icon: BookOpenText,
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

  const flowSteps = [
    ['Publish', 'unlisted URL for a self-contained HTML artifact'],
    ['Review', 'point, text, and element feedback on the render'],
    ['Revise', 'structured threads returned to the next agent run'],
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
                docscn gives agent-generated HTML a stable URL, a visual review
                surface, and feedback agents can use for the next revision.
                Publish without an account; sign in when you need ownership or
                private sharing.
              </p>

              <div className="home-stat-strip home-reveal home-delay-3 mt-7">
                <span className="home-stat">stable URLs</span>
                <span className="home-stat">visual comments</span>
                <span className="home-stat">agent feedback</span>
              </div>

              <div className="home-reveal home-delay-4 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  <Link href="/skills.md">
                    Agent guide <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <HeroInstallTerminal className="home-terminal home-reveal home-delay-5 mt-10" />
            </section>

            <aside
              aria-label="Artifact workflow preview"
              className="home-sheet home-reveal home-delay-3"
            >
              <div className="home-sheet-inner p-5">
                <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                  <div>
                    <p className="home-sheet-label">artifact review · v2</p>
                    <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                      Generated incident report
                    </p>
                  </div>
                  <span className="home-stat">v2</span>
                </div>

                <div className="grid gap-3 py-5">
                  {flowSteps.map((item, index) => (
                    <div className="home-flow-step" key={item[0]}>
                      <p className="home-flow-index">0{index + 1}</p>
                      <p className="mt-1 text-sm leading-6">
                        <strong className="text-foreground">{item[0]}</strong>
                        <span className="text-muted-foreground">
                          {' '}
                          — {item[1]}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-dashed border-primary/35 bg-primary/8 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Download className="h-3.5 w-3.5" />
                    CLI quickstart
                  </div>
                  <HeroCliQuickstartPreview />
                </div>
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
              Agents are increasingly producing rich, visual HTML instead of
              long markdown files.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              docscn is the missing place to host those files, share them with a
              stable link, review the rendered page, and send feedback back into
              the next agent run. The idea is inspired in part by
              Anthropic&apos;s{' '}
              <a
                className="font-medium text-primary underline-offset-4 hover:underline"
                href="https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html"
                rel="noopener noreferrer"
                target="_blank"
              >
                unreasonable effectiveness of HTML
              </a>
              .
            </p>
          </aside>
        </Shell>

        <HomeGallerySection className="border-t border-border/60" />

        <Shell className="home-scroll-reveal pb-24 pt-4">
          <div className="home-section-head mb-8 max-w-xl">
            <p className="home-kicker">Publishing paths</p>
            <h2>Use the browser, CLI, API, or MCP.</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Start with the hosted workspace, install the local CLI, or wire
              docscn into agent workflows with OpenAPI, MCP, and skills.md.
            </p>
          </div>

          <div className="home-manifest">
            <div className="home-manifest-header">Ways to publish</div>
            <div className="home-manifest-grid">
              {agentIntegrations.map((item) => (
                <Link
                  className="home-manifest-link group"
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
                No account required. Stable URL in seconds.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/publish">
                Open publish workspace <ArrowRight className="h-4 w-4" />
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
