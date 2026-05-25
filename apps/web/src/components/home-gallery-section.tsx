'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, PanelsTopLeft } from 'lucide-react';
import { Button, Shell } from '@docscn/ui';
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

export function HomeGallerySection({ className }: { className?: string }) {
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
    <Shell
      className={`home-scroll-reveal py-12 pb-20 lg:py-16 ${className ?? ''}`}
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="home-section-head max-w-2xl">
          <p className="home-kicker">Examples</p>
          <h2>HTML artifacts worth sharing.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {hasLiveArtifacts
              ? 'Recently published artifacts from this instance.'
              : 'Starter demos show the kinds of plans, reports, dashboards, and prototypes docscn is built to host.'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={hasLiveArtifacts ? '/dashboard' : '/publish'}>
            {hasLiveArtifacts ? 'View dashboard' : 'Publish your own'}{' '}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="home-gallery-grid mt-8">
        {hasLiveArtifacts
          ? (artifacts ?? []).map((artifact) => (
              <Link href={`/artifacts/${artifact.slug}`} key={artifact.id}>
                <article className="home-gallery-card group h-full">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <PanelsTopLeft className="h-5 w-5 text-primary" />
                      <span className="home-gallery-kind">
                        {artifact.metadata.kind}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold leading-tight tracking-tight">
                      {artifact.metadata.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {artifact.metadata.description}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-primary">
                    Open live artifact
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </article>
              </Link>
            ))
          : featuredExamples.map((example) => (
              <Link href={getGalleryArtifactHref(example.id)} key={example.id}>
                <article className="home-gallery-card group h-full">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <PanelsTopLeft className="h-5 w-5 text-primary" />
                      <span className="home-gallery-kind">Starter demo</span>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold leading-tight tracking-tight">
                      {example.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {example.description}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-primary">
                    {example.kind}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </article>
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
