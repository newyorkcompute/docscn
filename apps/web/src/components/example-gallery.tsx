'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import type { ExampleArtifactDefinition } from '../lib/example-artifacts';
import { getExamplePublishCommand } from '../lib/example-artifacts';
import { Badge, Button, Card } from '@docscn/ui';

function CopyCommandButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      className="shrink-0"
      onClick={copyCommand}
      size="sm"
      type="button"
      variant="outline"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy CLI'}
    </Button>
  );
}

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
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
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
            <Card className="flex h-full flex-col p-5" key={example.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone="muted">{example.kind}</Badge>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {example.title}
                  </h3>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-primary"
                  href={`/examples/${example.id}`}
                >
                  Preview
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                {example.description}
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-border bg-secondary/40 p-3 font-mono text-xs text-foreground">
                  {publishCommand}
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyCommandButton command={publishCommand} />
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/examples/${example.id}`}>Open preview</Link>
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
