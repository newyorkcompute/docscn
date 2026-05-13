'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [selectedRevisionId, setSelectedRevisionId] = useState(
    initialArtifact?.currentRevisionId,
  );
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [requestedChange, setRequestedChange] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('Sid');
  const [reviewStatus, setReviewStatus] = useState<'open' | 'needs-revision'>(
    'needs-revision',
  );
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>(
    {},
  );
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionHtml, setRevisionHtml] = useState('');
  const [revisionAuthor, setRevisionAuthor] = useState('Cursor agent');
  const [resolvedThreadIds, setResolvedThreadIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();

  const artifact = initialArtifact;

  useEffect(() => {
    setSelectedRevisionId(initialArtifact?.currentRevisionId);
  }, [initialArtifact?.currentRevisionId]);

  const selectedRevision = useMemo<ArtifactRevision | undefined>(
    () =>
      artifact?.revisions.find(
        (revision) => revision.id === selectedRevisionId,
      ) ?? artifact?.revisions[0],
    [artifact, selectedRevisionId],
  );

  useEffect(() => {
    setRevisionHtml(selectedRevision?.html ?? '');
  }, [selectedRevision?.id, selectedRevision?.html]);

  async function refreshAfterAction() {
    router.refresh();
  }

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !artifact ||
      !selectedRevision ||
      !reviewTitle.trim() ||
      !reviewBody.trim()
    ) {
      return;
    }

    setPendingAction('thread');
    setActionError(undefined);

    try {
      const response = await fetch(`/api/artifacts/${artifact.id}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId: selectedRevision.id,
          title: reviewTitle,
          body: reviewBody,
          authorName: reviewAuthor,
          status: reviewStatus,
          requestedChange,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not create review thread.');
      }

      setReviewTitle('');
      setReviewBody('');
      setRequestedChange('');
      await refreshAfterAction();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Review action failed.',
      );
    } finally {
      setPendingAction(undefined);
    }
  }

  async function addComment(threadId: string) {
    const body = commentBodies[threadId]?.trim();
    if (!body) {
      return;
    }

    setPendingAction(`comment-${threadId}`);
    setActionError(undefined);

    try {
      const response = await fetch(`/api/review-threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          authorName: reviewAuthor,
          role: 'human',
        }),
      });

      if (!response.ok) {
        throw new Error('Could not add comment.');
      }

      setCommentBodies((current) => ({ ...current, [threadId]: '' }));
      await refreshAfterAction();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Comment failed.',
      );
    } finally {
      setPendingAction(undefined);
    }
  }

  async function submitRevision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !artifact ||
      !revisionSummary.trim() ||
      !revisionHtml.includes('<html')
    ) {
      return;
    }

    setPendingAction('revision');
    setActionError(undefined);

    try {
      const response = await fetch(`/api/artifacts/${artifact.id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: revisionSummary,
          html: revisionHtml,
          authorName: revisionAuthor,
          source: 'web',
          resolvedThreadIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not submit revision.');
      }

      setRevisionSummary('');
      setResolvedThreadIds([]);
      await refreshAfterAction();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Revision failed.',
      );
    } finally {
      setPendingAction(undefined);
    }
  }

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
          {actionError ? (
            <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {actionError}
            </Card>
          ) : null}

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <PanelRightOpen className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Review threads</h2>
            </div>
            <form className="mt-5 space-y-3" onSubmit={createThread}>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Thread title"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
              />
              <textarea
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                placeholder="What should change?"
                value={reviewBody}
                onChange={(event) => setReviewBody(event.target.value)}
              />
              <textarea
                className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none ring-ring focus:ring-2"
                placeholder="Agent-readable requested change (optional)"
                value={requestedChange}
                onChange={(event) => setRequestedChange(event.target.value)}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  placeholder="Reviewer"
                  value={reviewAuthor}
                  onChange={(event) => setReviewAuthor(event.target.value)}
                />
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  value={reviewStatus}
                  onChange={(event) =>
                    setReviewStatus(
                      event.target.value as 'open' | 'needs-revision',
                    )
                  }
                >
                  <option value="needs-revision">needs revision</option>
                  <option value="open">open</option>
                </select>
              </div>
              <Button
                className="w-full"
                disabled={pendingAction === 'thread'}
                size="sm"
                type="submit"
              >
                {pendingAction === 'thread'
                  ? 'Creating thread...'
                  : 'Create thread'}
              </Button>
            </form>
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
                    <div className="mt-4 space-y-2">
                      <textarea
                        className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none ring-ring focus:ring-2"
                        placeholder="Reply to this thread"
                        value={commentBodies[thread.id] ?? ''}
                        onChange={(event) =>
                          setCommentBodies((current) => ({
                            ...current,
                            [thread.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        disabled={pendingAction === `comment-${thread.id}`}
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => addComment(thread.id)}
                      >
                        {pendingAction === `comment-${thread.id}`
                          ? 'Adding reply...'
                          : 'Add reply'}
                      </Button>
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
            <form className="mt-5 space-y-3" onSubmit={submitRevision}>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Revision summary"
                value={revisionSummary}
                onChange={(event) => setRevisionSummary(event.target.value)}
              />
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                placeholder="Author / agent"
                value={revisionAuthor}
                onChange={(event) => setRevisionAuthor(event.target.value)}
              />
              <textarea
                className="min-h-40 w-full rounded-md border border-input bg-black/40 px-3 py-2 font-mono text-xs outline-none ring-ring focus:ring-2"
                value={revisionHtml}
                onChange={(event) => setRevisionHtml(event.target.value)}
              />
              {threads.filter((thread) => thread.status !== 'resolved')
                .length ? (
                <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mark threads resolved by this revision
                  </p>
                  {threads
                    .filter((thread) => thread.status !== 'resolved')
                    .map((thread) => (
                      <label
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                        key={thread.id}
                      >
                        <input
                          className="mt-0.5"
                          checked={resolvedThreadIds.includes(thread.id)}
                          type="checkbox"
                          onChange={(event) => {
                            setResolvedThreadIds((current) =>
                              event.target.checked
                                ? [...current, thread.id]
                                : current.filter((id) => id !== thread.id),
                            );
                          }}
                        />
                        <span>{thread.title}</span>
                      </label>
                    ))}
                </div>
              ) : null}
              <Button
                className="w-full"
                disabled={pendingAction === 'revision'}
                size="sm"
                type="submit"
              >
                {pendingAction === 'revision'
                  ? 'Submitting revision...'
                  : 'Submit revision'}
              </Button>
            </form>
            <div className="mt-5 space-y-4">
              {artifact.revisions
                .slice()
                .reverse()
                .map((revision) => (
                  <button
                    className="block w-full rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover:border-primary/50"
                    key={revision.id}
                    type="button"
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
