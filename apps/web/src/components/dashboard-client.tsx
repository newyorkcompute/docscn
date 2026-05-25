'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Artifact } from '@docscn/sdk';
import type { ExampleArtifactDefinition } from '../lib/example-artifacts';
import { Badge, Button, Card, Shell } from '@docscn/ui';
import { AnonymousClaimSync } from './anonymous-claim-sync';
import { AppPageHeader } from './app-page-header';
import { CopyCommandButton } from './copy-command-button';
import { ExampleGallery } from './example-gallery';

export function DashboardClient({
  artifacts,
  examples,
  isAuthenticated,
  origin,
}: {
  artifacts: Artifact[];
  examples: ExampleArtifactDefinition[];
  isAuthenticated: boolean;
  origin: string;
}) {
  const publishCommand = `docscn publish artifact.html --host ${origin}`;
  const isEmpty = artifacts.length === 0;
  const starterExamples = examples.filter(
    (example) => example.id !== 'minimal',
  );
  const description = isEmpty
    ? 'Publish your first HTML artifact to get a stable URL and review surface.'
    : `${artifacts.length} visible artifact${
        artifacts.length === 1 ? '' : 's'
      } in this workspace.`;

  return (
    <Shell className="space-y-6 py-10">
      <AnonymousClaimSync isAuthenticated={isAuthenticated} />
      <AppPageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/templates">Browse templates</Link>
            </Button>
            <Button asChild>
              <Link href="/publish">Publish artifact</Link>
            </Button>
          </>
        }
        description={description}
        eyebrow="artifact workspace"
        title="Your artifacts"
      />

      {isEmpty ? (
        <Card className="feature-card p-6 md:p-8">
          <Badge tone="outline">empty workspace</Badge>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            No artifacts yet
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Publish from the browser, or copy the CLI command and run it from an
            agent workflow.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <code className="app-code-panel overflow-x-auto rounded-xl p-3 font-mono text-xs text-foreground">
              {publishCommand}
            </code>
            <CopyCommandButton command={publishCommand} label="Copy CLI" />
          </div>
          <div className="mt-6">
            <Button asChild>
              <Link href="/publish">Publish from browser</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {artifacts.map((artifact) => (
            <Link key={artifact.id} href={`/artifacts/${artifact.slug}`}>
              <Card className="feature-card group h-full p-6 transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone="muted">{artifact.metadata.kind}</Badge>
                    <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
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
      )}

      {isEmpty ? (
        <ExampleGallery
          description="Open a starter template in the workspace, then publish your own version from an agent."
          examples={starterExamples}
          heading="Starter templates"
        />
      ) : (
        <Card className="feature-card p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Need a starting point?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse templates for plans, PR reviews, reports, design systems,
                diagrams, decks, and custom editors.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/templates">Open template library</Link>
            </Button>
          </div>
        </Card>
      )}
    </Shell>
  );
}
