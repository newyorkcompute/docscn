'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge, Button, Shell } from '@docscn/ui';
import { ArtifactFrame } from './artifact-frame';

export function ExamplePreviewClient({
  title,
  kind,
  filename,
  html,
  publishCommand,
}: {
  title: string;
  kind: string;
  filename: string;
  html: string;
  publishCommand: string;
}) {
  return (
    <Shell className="space-y-6 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Button asChild className="mb-4" size="sm" variant="ghost">
            <Link href="/examples">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All examples
            </Link>
          </Button>
          <Badge tone="muted">{kind}</Badge>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Preview of <code>{filename}</code>. Publish it with the CLI to get a
            shareable artifact URL and start leaving review feedback.
          </p>
        </div>
        <Button asChild>
          <Link href="/publish">Publish from browser</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ArtifactFrame html={html} showChrome={false} title={title} />
      </div>

      <div className="rounded-lg border border-border bg-secondary/40 p-4 font-mono text-xs text-foreground">
        {publishCommand}
      </div>
    </Shell>
  );
}
