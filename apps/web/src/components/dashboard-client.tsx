'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  Code2,
  Download,
  MessageSquare,
  MousePointer2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { Artifact } from '@docscn/sdk';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';

export function DashboardClient({
  artifacts,
  origin,
}: {
  artifacts: Artifact[];
  origin: string;
}) {
  const installCommand = `curl ${origin}/install -fsS | bash`;
  const loginCommand = `docscn login --host ${origin}`;
  const publishCommand = `docscn publish artifact.html --host ${origin}`;
  const sampleArtifact =
    artifacts.find(
      (artifact) => artifact.slug === 'docscn-annotation-theme-test',
    ) ?? artifacts[0];

  return (
    <Shell className="space-y-8 py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Eyebrow>localhost artifact workspace</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Host, share, and collaborate on AI-generated HTML.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Start with the CLI, publish an artifact to a stable URL, collaborate
            with point/text/element feedback, then let an agent submit the next
            revision.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {sampleArtifact ? (
            <Button asChild variant="outline">
              <Link href={`/artifacts/${sampleArtifact.slug}`}>
                Try sample artifact
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href="/publish">Publish artifact</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Local quickstart</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use the same curl installer locally that hosted users will use on
            docscn.ai. It downloads the latest standalone CLI binary from GitHub
            Releases.
          </p>
          <div className="mt-5 space-y-2 rounded-lg border border-border bg-secondary/40 p-4 font-mono text-xs text-foreground">
            <p>{installCommand}</p>
            <p>{loginCommand}</p>
            <p>{publishCommand}</p>
          </div>
        </Card>

        <Card className="p-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-semibold">{artifacts.length}</p>
          <p className="text-sm text-muted-foreground">visible artifacts</p>
          <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Install CLI
            </div>
            <div className="flex items-center gap-2">
              <MousePointer2 className="h-4 w-4 text-primary" />
              Annotate artifact
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Revise from threads
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            '1. Host',
            Code2,
            'Agents publish complete HTML documents to stable local or hosted URLs.',
          ],
          [
            '2. Collaborate',
            MousePointer2,
            'Humans leave point, text, and element feedback on the rendered artifact.',
          ],
          [
            '3. Revise',
            MessageSquare,
            'Agents read structured review threads and submit a new revision.',
          ],
        ].map(([title, Icon, body]) => (
          <Card className="p-5" key={title as string}>
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body as string}
            </p>
          </Card>
        ))}
      </section>

      {!artifacts.length ? (
        <Card className="border-dashed p-8 text-center">
          <Badge tone="outline">first run</Badge>
          <h2 className="mt-4 text-2xl font-semibold">
            No artifacts published yet.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Install the CLI, publish a self-contained HTML file, and this
            dashboard becomes your review queue.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/publish">Publish from the browser</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {artifacts.map((artifact) => (
          <Link key={artifact.id} href={`/artifacts/${artifact.slug}`}>
            <Card className="group h-full p-6 transition hover:border-primary/50 hover:bg-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="muted">{artifact.metadata.kind}</Badge>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                    {artifact.metadata.title}
                  </h2>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {artifact.metadata.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge>{artifact.metadata.visibility}</Badge>
                <Badge tone="outline">{artifact.metadata.source}</Badge>
                <Badge tone="outline">v{artifact.revisions.length}</Badge>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>{artifact.metadata.author.name}</span>
                <span>
                  {new Date(artifact.metadata.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </Shell>
  );
}
