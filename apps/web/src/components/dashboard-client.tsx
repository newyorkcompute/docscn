'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  GitPullRequestArrow,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { Artifact } from '@docscn/sdk';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { readLocalArtifacts } from '../lib/local-artifacts';

export function DashboardClient({ artifacts }: { artifacts: Artifact[] }) {
  const [localArtifacts, setLocalArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    setLocalArtifacts(readLocalArtifacts());
  }, []);

  const allArtifacts = useMemo(
    () => [...localArtifacts, ...artifacts],
    [artifacts, localArtifacts],
  );

  return (
    <Shell className="space-y-8 py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Eyebrow>artifact workspace</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Review agent-generated work before it becomes reality.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            These are interactive HTML artifacts: plans, dashboards, timelines,
            prototypes, and PR review surfaces ready for human feedback.
          </p>
        </div>
        <Button asChild>
          <Link href="/publish">Publish artifact</Link>
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-semibold">{allArtifacts.length}</p>
          <p className="text-sm text-muted-foreground">published artifacts</p>
        </Card>
        <Card className="p-5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-semibold">3</p>
          <p className="text-sm text-muted-foreground">review threads</p>
        </Card>
        <Card className="p-5">
          <GitPullRequestArrow className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-semibold">1.5</p>
          <p className="text-sm text-muted-foreground">
            avg revisions accepted
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {allArtifacts.map((artifact) => (
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
