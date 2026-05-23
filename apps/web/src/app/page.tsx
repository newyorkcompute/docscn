import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Code2,
  Download,
  MessageSquare,
  PanelsTopLeft,
  RefreshCcw,
  Terminal,
} from 'lucide-react';
import { listArtifacts } from '@docscn/db';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { getServerSession } from '../lib/session';
import { getRequestOrigin } from '../lib/request-origin';
import { SiteHeader } from '../components/site-header';

export const dynamic = 'force-dynamic';

export default async function Index() {
  const session = await getServerSession();
  const artifacts = await listArtifacts({ viewerUserId: session?.user.id });
  const origin = await getRequestOrigin();
  const installCommand = `curl ${origin}/install -fsS | bash`;
  const publishCommand = `docscn publish artifact.html --host ${origin}`;

  return (
    <>
      <SiteHeader />
      <main>
        <Shell className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <section>
            <Badge tone="outline">
              open-source / localhost-first / agent-native
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
              Host, share, and collaborate on AI-generated HTML artifacts.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Publish artifacts from Cursor, Claude, OpenCode, scheduled agents,
              and scripts. Review them visually with your team, keep stable
              share links, and send structured feedback back into the next
              revision.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/artifacts/docscn-annotation-theme-test">
                  Try collaboration canvas
                </Link>
              </Button>
            </div>
            <div className="mt-8 rounded-xl border border-border bg-card p-3 shadow-sm shadow-black/3">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-xs text-muted-foreground">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                install locally
              </div>
              <pre className="overflow-x-auto pt-3 font-mono text-sm text-foreground">
                <code>{installCommand}</code>
              </pre>
            </div>
          </section>

          <Card className="p-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Eyebrow>
                    host {'->'} collaborate {'->'} revise
                  </Eyebrow>
                  <p className="mt-2 text-xl font-semibold">
                    Generated incident report
                  </p>
                </div>
                <Badge>v2</Badge>
              </div>
              <div className="grid gap-3 py-4">
                {[
                  'agent publishes a self-contained HTML artifact to a stable URL',
                  'team comments on points, text selections, and elements',
                  'agent reads structured feedback and submits the next revision',
                ].map((item, index) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    key={item}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Download className="h-3.5 w-3.5" />
                  CLI quickstart
                </div>
                <p className="mt-3 font-mono text-xs text-primary">
                  {installCommand}
                </p>
                <p className="mt-2 font-mono text-xs text-primary">
                  {publishCommand}
                </p>
              </div>
            </div>
          </Card>
        </Shell>

        <Shell className="grid gap-4 md:grid-cols-3">
          {[
            [
              'Publishing, not notes',
              Code2,
              'Host self-contained HTML from Cursor, Claude, OpenCode, MCP tools, scheduled agents, and scripts.',
            ],
            [
              'Collaborate like PRs/Figma',
              MessageSquare,
              'Point, text, and element annotations stay attached to the rendered artifact and its revisions.',
            ],
            [
              'Revision loop',
              RefreshCcw,
              'Agents fetch open review threads as JSON and publish a complete revised HTML document.',
            ],
          ].map(([title, Icon, body]) => (
            <Card className="p-6" key={title as string}>
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-5 text-xl font-semibold">{title as string}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {body as string}
              </p>
            </Card>
          ))}
        </Shell>

        <Shell className="py-20">
          <div className="flex items-end justify-between gap-5">
            <div>
              <Eyebrow>artifact examples</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Built for AI-native work surfaces.
              </h2>
            </div>
            <Button asChild variant="ghost">
              <Link href="/dashboard">View all</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {artifacts.map((artifact) => (
              <Card className="p-5" key={artifact.id}>
                <PanelsTopLeft className="h-5 w-5 text-primary" />
                <h3 className="mt-5 font-semibold">
                  {artifact.metadata.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {artifact.metadata.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge tone="muted">{artifact.metadata.kind}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </Shell>

        <Shell className="pb-20">
          <Card className="grid gap-6 p-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Bot className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Ready for MCP, skills, APIs, and CLI publishing.
              </h2>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <p>Claude/Cursor/OpenCode publish artifacts directly.</p>
              <p>
                /skills.md tells agents how to publish, read feedback, and
                revise.
              </p>
              <p>Agents consume comments and revision requests as JSON.</p>
              <p>GitHub Releases provide the standalone CLI binary.</p>
              <p>Self-host with Postgres and S3-compatible storage.</p>
            </div>
          </Card>
        </Shell>
      </main>
    </>
  );
}
