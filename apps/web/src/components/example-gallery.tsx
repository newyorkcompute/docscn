'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { ExampleArtifactDefinition } from '../lib/example-artifacts';
import { getExamplePublishCommand } from '../lib/example-artifacts';
import { getGalleryArtifactHref } from '../lib/gallery-artifacts';
import { Badge, Button, Card } from '@docscn/ui';
import { CopyCommandButton } from './copy-command-button';

export function ExampleGallery({
  examples,
  origin,
  heading = 'Example artifacts',
  description = 'Preview these self-contained HTML files locally, then publish one to start the review loop.',
}: {
  examples: ExampleArtifactDefinition[];
  origin: string;
  heading?: string;
  description?: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {heading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {examples.map((example) => {
          const publishCommand = getExamplePublishCommand(
            origin,
            example.filename,
          );

          return (
            <Card className="feature-card flex h-full flex-col p-5" key={example.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="muted">{example.kind}</Badge>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                    {example.title}
                  </h3>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
                  href={getGalleryArtifactHref(example.id)}
                >
                  Open artifact
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                {example.description}
              </p>
              <div className="mt-5 space-y-3">
                <div className="terminal-block rounded-lg border border-border p-3 font-mono text-xs text-foreground">
                  {publishCommand}
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyCommandButton command={publishCommand} label="Copy CLI" />
                  <Button asChild size="sm" variant="ghost">
                    <Link href={getGalleryArtifactHref(example.id)}>
                      Open in workspace
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
