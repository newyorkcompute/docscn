import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Code2,
  MessageSquare,
  PanelsTopLeft,
  RefreshCcw,
} from 'lucide-react';
import { getArtifacts } from '@docscn/db';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { SiteHeader } from '../components/site-header';

export default function Index() {
  const artifacts = getArtifacts();

  return (
    <>
      <SiteHeader />
      <main>
        <Shell className="grid gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section>
            <Badge tone="outline">
              open-source / self-hostable / agent-native
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
              Publish and review the HTML artifacts agents create.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              docscn is an open-source workspace for agent-generated HTML
              artifacts. Publish interactive plans, reports, diagrams,
              prototypes, and docs. Review them with your team. Let agents
              revise from feedback.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/publish">
                  Publish artifact <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Explore dashboard</Link>
              </Button>
            </div>
          </section>

          <Card className="p-4">
            <div className="rounded-xl border border-border bg-black/60 p-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Eyebrow>
                    publish {'->'} review {'->'} revise
                  </Eyebrow>
                  <p className="mt-2 text-xl font-semibold">
                    Generated incident report
                  </p>
                </div>
                <Badge>v2</Badge>
              </div>
              <div className="grid gap-3 py-4">
                {[
                  'publish self-contained HTML',
                  'comment with revision requests',
                  'agents revise from structured feedback',
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
                <p className="font-mono text-xs text-primary">
                  npx docscn publish artifact.html
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
              'Self-contained HTML from Cursor, Claude, OpenCode, MCP tools, and scheduled agents.',
            ],
            [
              'Review like PRs/Figma',
              MessageSquare,
              'Threads, anchors, requested changes, and status around the artifact itself.',
            ],
            [
              'Revision loop',
              RefreshCcw,
              'Structured feedback that agents can read and use to generate the next artifact revision.',
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
              <p>MCP tools enrich artifacts with external context.</p>
              <p>Agents consume comments and revision requests.</p>
              <p>Self-host with Postgres, S3-compatible storage, and Redis.</p>
            </div>
          </Card>
        </Shell>
      </main>
    </>
  );
}
