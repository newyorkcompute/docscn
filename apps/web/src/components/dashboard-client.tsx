'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Artifact } from '@docscn/sdk';
import type { ExampleArtifactDefinition } from '../lib/example-artifacts';
import { Badge, Button, Card, Shell } from '@docscn/ui';
import { AnonymousClaimSync } from './anonymous-claim-sync';
import { AppPageHeader } from './app-page-header';
import { CopyCommandButton } from './copy-command-button';
import { ExampleGallery } from './example-gallery';

const FEATURED_STARTER_IDS = [
  'html-effectiveness-code-approaches',
  'html-effectiveness-code-review-pr',
  'html-effectiveness-visual-designs',
  'html-effectiveness-prompt-tuner',
];

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
  const isEmpty = artifacts.length === 0;

  const installCommand = `curl ${origin}/install -fsS | bash`;
  const templateCommand =
    'docscn template get html-effectiveness-code-approaches --output artifact.html';
  const publishCommand = `docscn publish artifact.html --host ${origin}`;

  const steps = [
    { label: 'Install the CLI', command: installCommand },
    { label: 'Grab a starter template', command: templateCommand },
    { label: 'Publish to a review URL', command: publishCommand },
  ];

  const featuredExamples = examples.filter((e) =>
    FEATURED_STARTER_IDS.includes(e.id),
  );

  const description = isEmpty
    ? 'Install the CLI and publish your first HTML artifact in under a minute.'
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
              <Link href="/publish">Publishing guide</Link>
            </Button>
          </>
        }
        description={description}
        eyebrow={isEmpty ? 'getting started' : 'artifact workspace'}
        title={isEmpty ? 'Publish your first artifact' : 'Your artifacts'}
      />

      {isEmpty ? (
        <Card className="feature-card p-6 md:p-8">
          <Badge tone="outline">getting started</Badge>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            Three commands to your first review URL
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Install the CLI, grab a template, and publish — all from the
            terminal or an agent workflow.
          </p>
          <ol className="mt-6 grid gap-3">
            {steps.map((step, i) => (
              <li
                className="grid gap-3 rounded-xl border border-border bg-background/45 p-3 md:grid-cols-[1fr_auto] md:items-center"
                key={step.label}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[0.6rem] text-primary">
                      {i + 1}
                    </span>
                    {step.label}
                  </p>
                  <code className="mt-2 block overflow-x-auto font-mono text-xs text-foreground">
                    {step.command}
                  </code>
                </div>
                <CopyCommandButton command={step.command} label="Copy" />
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/publish">
                Open publishing guide <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign in to claim artifacts</Link>
              </Button>
            )}
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
        <div className="space-y-4">
          <ExampleGallery
            description="Pick a starter, open it in the workspace, and publish your own version."
            examples={featuredExamples}
            heading="Featured templates"
          />
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/templates">
                Browse all templates <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
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
