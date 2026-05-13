'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Clock3,
  GitCommitHorizontal,
  MessageSquareText,
  PanelRightOpen,
} from 'lucide-react';
import type { Artifact, ArtifactRevision, ReviewThread } from '@docscn/sdk';
import { Badge, Button, Card, Eyebrow, Shell, cn } from '@docscn/ui';
import { ArtifactFrame } from './artifact-frame';

export function ArtifactWorkspace({
  artifact: initialArtifact,
  threads,
  artifactId,
}: {
  artifact?: Artifact;
  threads: ReviewThread[];
  artifactId: string;
}) {
  const [selectedRevisionId, setSelectedRevisionId] = useState(
    initialArtifact?.currentRevisionId,
  );

  const artifact = initialArtifact;

  const selectedRevision = useMemo<ArtifactRevision | undefined>(
    () =>
      artifact?.revisions.find(
        (revision) => revision.id === selectedRevisionId,
      ) ?? artifact?.revisions[0],
    [artifact, selectedRevisionId],
  );

  if (!artifact || !selectedRevision) {
    return (
      <Shell className="py-20">
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <Eyebrow>artifact missing</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold">No artifact found</h1>
          <p className="mt-3 text-muted-foreground">
            This can happen if a local mock artifact was published in another
            browser or the URL was typed manually.
          </p>
          <Button asChild className="mt-6">
            <Link href="/publish">Publish a new artifact</Link>
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell className="space-y-6 py-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{artifact.metadata.visibility}</Badge>
            <Badge tone="outline">{artifact.metadata.kind}</Badge>
            <Badge tone="outline">{artifact.metadata.source}</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            {artifact.metadata.title}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {artifact.metadata.description}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/publish">Publish another</Link>
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-mono text-sm text-primary">
                {artifact.metadata.author.avatarFallback}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {artifact.metadata.author.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  created{' '}
                  {new Date(artifact.metadata.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {artifact.revisions.map((revision) => (
                <button
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition',
                    revision.id === selectedRevision.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                  key={revision.id}
                  onClick={() => setSelectedRevisionId(revision.id)}
                >
                  v{revision.version}
                </button>
              ))}
            </div>
          </Card>

          <ArtifactFrame
            html={selectedRevision.html}
            title={artifact.metadata.title}
          />
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <PanelRightOpen className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Review threads</h2>
            </div>
            <div className="mt-5 space-y-4">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No review threads yet. This artifact is ready for first pass
                  feedback.
                </p>
              ) : (
                threads.map((thread) => (
                  <div
                    className="rounded-xl border border-border bg-secondary/30 p-4"
                    key={thread.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge
                          tone={
                            thread.status === 'resolved'
                              ? 'success'
                              : thread.status === 'needs-revision'
                                ? 'warning'
                                : 'muted'
                          }
                        >
                          {thread.status}
                        </Badge>
                        <h3 className="mt-3 text-sm font-medium">
                          {thread.title}
                        </h3>
                      </div>
                      <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {thread.requestedChange ? (
                      <p className="mt-3 rounded-lg bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
                        {thread.requestedChange}
                      </p>
                    ) : null}
                    <div className="mt-3 space-y-3">
                      {thread.comments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <p className="font-medium">{comment.author.name}</p>
                          <p className="mt-1 text-muted-foreground">
                            {comment.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <GitCommitHorizontal className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Revision history</h2>
            </div>
            <div className="mt-5 space-y-4">
              {artifact.revisions
                .slice()
                .reverse()
                .map((revision) => (
                  <button
                    className="block w-full rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/50"
                    key={revision.id}
                    onClick={() => setSelectedRevisionId(revision.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        tone={
                          revision.id === selectedRevision.id
                            ? 'default'
                            : 'muted'
                        }
                      >
                        v{revision.version}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {new Date(revision.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {revision.summary}
                    </p>
                  </button>
                ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Agent-readable loop</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Threads, anchors, requested changes, and revision summaries are
              typed for future publish APIs, MCP tools, skills, and CLI
              automation.
            </p>
          </Card>
        </aside>
      </div>
    </Shell>
  );
}
