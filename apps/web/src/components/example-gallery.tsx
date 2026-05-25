'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  exampleArtifactCategories,
  type ExampleArtifactDefinition,
} from '../lib/example-artifacts';
import { getGalleryArtifactHref } from '../lib/gallery-artifacts';
import { Badge, Card } from '@docscn/ui';

export function ExampleGallery({
  examples,
  heading = 'Example artifacts',
  description = 'Preview these self-contained HTML files locally, then publish one to start the review loop.',
}: {
  examples: ExampleArtifactDefinition[];
  heading?: string;
  description?: string;
}) {
  const groups = exampleArtifactCategories
    .map((category) => ({
      ...category,
      examples: examples.filter((example) => example.category === category.id),
    }))
    .filter((category) => category.examples.length > 0);

  return (
    <section className="space-y-6" id="example-gallery">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {heading}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-8">
        {groups.map((group) => (
          <section className="space-y-4" key={group.id}>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {group.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {group.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {group.examples.map((example) => (
                <Link
                  href={getGalleryArtifactHref(example.id)}
                  key={example.id}
                >
                  <Card className="feature-card group flex h-full flex-col p-5">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="muted">{example.kind}</Badge>
                          {example.source ? (
                            <Badge tone="outline">{example.source.label}</Badge>
                          ) : null}
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                      </div>
                      <h4 className="mt-4 font-display text-xl font-semibold tracking-tight">
                        {example.title}
                      </h4>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                      {example.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
