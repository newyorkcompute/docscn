'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, PanelsTopLeft } from 'lucide-react';
import { Badge, Button, Card, Eyebrow, Shell } from '@docscn/ui';
import { exampleArtifacts } from '../lib/example-artifacts';
import { getGalleryArtifactHref } from '../lib/gallery-artifacts';

const featuredExamples = exampleArtifacts.slice(0, 4);

type GalleryArtifact = {
  id: string;
  slug: string;
  metadata: {
    title: string;
    description: string;
    kind: string;
  };
};

export function HomeGallerySection() {
  const [artifacts, setArtifacts] = useState<GalleryArtifact[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/artifacts')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.artifacts)) {
          setArtifacts(data.artifacts);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const hasLiveArtifacts = (artifacts?.length ?? 0) > 0;

  return (
    <Shell className="py-4 pb-20">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>artifact examples</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Real outputs from agent workflows.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {hasLiveArtifacts
              ? 'Recently published artifacts from this instance.'
              : 'Starter demos open in the full artifact workspace. Your published artifacts replace them here.'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/examples">
            {hasLiveArtifacts ? 'View gallery' : 'Browse all examples'}{' '}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {hasLiveArtifacts
          ? (artifacts ?? []).map((artifact) => (
              <Link href={`/artifacts/${artifact.slug}`} key={artifact.id}>
                <Card className="feature-card group h-full p-5">
                  <PanelsTopLeft className="h-5 w-5 text-primary" />
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {artifact.metadata.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {artifact.metadata.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Badge tone="muted">{artifact.metadata.kind}</Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                </Card>
              </Link>
            ))
          : featuredExamples.map((example) => (
              <Link href={getGalleryArtifactHref(example.id)} key={example.id}>
                <Card className="feature-card group h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <PanelsTopLeft className="h-5 w-5 text-primary" />
                    <Badge tone="outline">Starter demo</Badge>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {example.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {example.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Badge tone="muted">{example.kind}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition group-hover:text-primary">
                      Open artifact
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
      </div>

      {!hasLiveArtifacts ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Ready to make one yours?{' '}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="/dashboard"
          >
            Open workspace
          </Link>
        </p>
      ) : null}
    </Shell>
  );
}
