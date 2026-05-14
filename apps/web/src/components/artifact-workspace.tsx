'use client';

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Clock3,
  Copy,
  GitCommitHorizontal,
  MessageSquareText,
  PanelRightOpen,
  Share2,
} from 'lucide-react';
import type {
  Artifact,
  ArtifactRevision,
  ReviewThread,
  ReviewThreadStatus,
} from '@docscn/sdk';
import { Badge, Button, Card, Eyebrow, Shell, cn } from '@docscn/ui';
import { ArtifactFrame } from './artifact-frame';

interface PendingAnchor {
  label: string;
  x: number;
  y: number;
}

function getPinPosition(thread: ReviewThread, index: number) {
  if (
    typeof thread.anchor?.x === 'number' &&
    typeof thread.anchor?.y === 'number'
  ) {
    return {
      left: `${Math.min(Math.max(thread.anchor.x, 6), 94)}%`,
      top: `${Math.min(Math.max(thread.anchor.y, 8), 92)}%`,
    };
  }

  return {
    left: `${68 + (index % 3) * 8}%`,
    top: `${18 + (index % 6) * 11}%`,
  };
}

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
  const [anchorLabel, setAnchorLabel] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('Sid');
  const [reviewStatus, setReviewStatus] = useState<'open' | 'needs-revision'>(
    'needs-revision',
  );
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'review' | 'revisions' | 'feedback'
  >('review');
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>(
    {},
  );
  const [revisionSummary, setRevisionSummary] = useState('');
  const [revisionHtml, setRevisionHtml] = useState('');
  const [revisionAuthor, setRevisionAuthor] = useState('Cursor agent');
  const [resolvedThreadIds, setResolvedThreadIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [actionError, setActionError] = useState<string | undefined>();
  const [copiedBundle, setCopiedBundle] = useState<string | undefined>();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [isPlacingComment, setIsPlacingComment] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<
    PendingAnchor | undefined
  >();

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

  const openThreads = useMemo(
    () => threads.filter((thread) => thread.status !== 'resolved'),
    [threads],
  );

  const feedbackBundle = useMemo(() => {
    if (!artifact || !selectedRevision) {
      return undefined;
    }

    return {
      artifact: {
        id: artifact.id,
        slug: artifact.slug,
        title: artifact.metadata.title,
        description: artifact.metadata.description,
        visibility: artifact.metadata.visibility,
        kind: artifact.metadata.kind,
      },
      revision: {
        id: selectedRevision.id,
        version: selectedRevision.version,
        summary: selectedRevision.summary,
      },
      instructions: {
        goal: 'Revise the self-contained HTML artifact using the review feedback.',
        constraints: [
          'Return a complete self-contained HTML document.',
          'Preserve useful existing interactions unless feedback asks to change them.',
          'Address each requested change explicitly.',
        ],
      },
      openThreads: openThreads.map((thread) => ({
        id: thread.id,
        status: thread.status,
        title: thread.title,
        anchor: thread.anchor,
        requestedChange: thread.requestedChange,
        comments: thread.comments.map((comment) => ({
          author: comment.author.name,
          role: comment.role,
          body: comment.body,
        })),
      })),
    };
  }, [artifact, openThreads, selectedRevision]);

  const feedbackJson = feedbackBundle
    ? JSON.stringify(feedbackBundle, null, 2)
    : '';

  const feedbackPrompt = feedbackBundle
    ? [
        `Revise "${feedbackBundle.artifact.title}" from revision v${feedbackBundle.revision.version}.`,
        '',
        feedbackBundle.openThreads.length
          ? 'Address these open review threads:'
          : 'There are no open review threads. Improve clarity without changing the intent.',
        ...feedbackBundle.openThreads.flatMap((thread, index) => [
          '',
          `${index + 1}. ${thread.title} (${thread.status})`,
          thread.requestedChange
            ? `Requested change: ${thread.requestedChange}`
            : 'Requested change: infer from comments.',
          ...thread.comments.map(
            (comment) =>
              `- ${comment.author} (${comment.role}): ${comment.body}`,
          ),
        ]),
        '',
        'Return only a complete self-contained HTML document.',
      ].join('\n')
    : '';

  async function copyFeedback(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopiedBundle(label);
    window.setTimeout(() => setCopiedBundle(undefined), 1600);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1600);
  }

  function selectThread(threadId: string) {
    setActiveSidebarTab('review');
    setActiveThreadId(threadId);
    setIsReviewOpen(true);
    window.setTimeout(() => {
      document
        .getElementById(`thread-${threadId}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  }

  function placeCommentAnchor(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const label = `Pin ${threads.length + 1}`;

    setPendingAnchor({ label, x, y });
    setAnchorLabel(label);
    setActiveSidebarTab('review');
    setIsReviewOpen(true);
    setIsPlacingComment(false);
  }

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
          anchorLabel: pendingAnchor?.label ?? anchorLabel,
          anchorX: pendingAnchor?.x,
          anchorY: pendingAnchor?.y,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not create review thread.');
      }

      setReviewTitle('');
      setReviewBody('');
      setRequestedChange('');
      setAnchorLabel('');
      setPendingAnchor(undefined);
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

  async function updateThreadStatus(
    threadId: string,
    status: ReviewThreadStatus,
  ) {
    setPendingAction(`status-${threadId}-${status}`);
    setActionError(undefined);

    try {
      const response = await fetch(`/api/review-threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Could not update thread status.');
      }

      await refreshAfterAction();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Thread status update failed.',
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="fixed inset-0">
        <ArtifactFrame
          className="h-full rounded-none border-0 shadow-none"
          html={selectedRevision.html}
          iframeClassName="h-screen min-h-screen"
          showChrome={false}
          title={artifact.metadata.title}
        />
      </div>

      <div className="pointer-events-none fixed left-3 top-3 z-40">
        <div className="pointer-events-auto max-w-[min(520px,calc(100vw-1.5rem))] rounded-full border border-border/80 bg-background/75 px-3 py-2 shadow-sm shadow-black/5 backdrop-blur-xl transition-opacity hover:bg-background/90">
          <Link
            className="flex min-w-0 items-center gap-2"
            href="/dashboard"
            title="Back to dashboard"
          >
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
              docscn
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="truncate text-sm font-medium">
              {artifact.metadata.title}
            </span>
          </Link>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-border/80 bg-background/75 p-1 shadow-sm shadow-black/5 backdrop-blur-xl transition-opacity hover:bg-background/90">
        <Button
          aria-label={`Open revision history, currently version ${selectedRevision.version}`}
          size="sm"
          title={`Revision v${selectedRevision.version}`}
          type="button"
          variant="ghost"
          onClick={() => {
            setActiveSidebarTab('revisions');
            setIsReviewOpen(true);
          }}
        >
          <GitCommitHorizontal className="h-4 w-4" />
          <span className="text-xs">v{selectedRevision.version}</span>
        </Button>
        <Button
          aria-label={copiedLink ? 'Copied share link' : 'Copy share link'}
          size="sm"
          title={copiedLink ? 'Copied' : 'Share'}
          type="button"
          variant="ghost"
          onClick={copyShareLink}
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only">{copiedLink ? 'Copied' : 'Share'}</span>
        </Button>
        <div className="relative">
          <Button
            aria-label={`Open review drawer, ${openThreads.length} open threads`}
            size="sm"
            title={`Review (${openThreads.length} open)`}
            type="button"
            variant={isReviewOpen ? 'secondary' : 'outline'}
            onClick={() => setIsReviewOpen((current) => !current)}
          >
            <MessageSquareText className="h-4 w-4" />
            <span className="sr-only">
              {isReviewOpen ? 'Hide review' : 'Review'}
            </span>
          </Button>
          {openThreads.length ? (
            <span className="pointer-events-none absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {openThreads.length}
            </span>
          ) : null}
        </div>
      </div>

      {isPlacingComment ? (
        <button
          aria-label="Place comment on artifact"
          className="fixed inset-0 z-30 cursor-crosshair bg-primary/5"
          type="button"
          onClick={placeCommentAnchor}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsPlacingComment(false);
            }
          }}
        >
          <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs text-primary shadow-sm">
            Click anywhere on the artifact to place a comment
          </div>
        </button>
      ) : null}

      {threads.length ? (
        <div className="pointer-events-none fixed inset-0 z-20">
          {threads.map((thread, index) => {
            const position = getPinPosition(thread, index);

            return (
              <button
                aria-label={`Open comment: ${thread.title}`}
                className={cn(
                  'pointer-events-auto absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-semibold shadow-sm transition',
                  thread.id === activeThreadId
                    ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/15'
                    : 'border-background bg-primary text-primary-foreground hover:scale-105',
                  thread.status === 'resolved' && 'opacity-45',
                )}
                key={thread.id}
                style={position}
                type="button"
                onClick={() => selectThread(thread.id)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      ) : null}

      {pendingAnchor ? (
        <button
          aria-label="Pending comment pin"
          className="pointer-events-none fixed z-30 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-background bg-primary text-xs font-semibold text-primary-foreground shadow-sm ring-4 ring-primary/15"
          style={{
            left: `${pendingAnchor.x}%`,
            top: `${pendingAnchor.y}%`,
          }}
          type="button"
        >
          +
        </button>
      ) : null}

      {isReviewOpen ? (
        <>
          <button
            aria-label="Close review drawer"
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[1px]"
            type="button"
            onClick={() => setIsReviewOpen(false)}
          />
          <aside className="fixed bottom-3 right-3 top-3 z-50 w-[min(420px,calc(100vw-1.5rem))] space-y-4 overflow-y-auto rounded-xl border border-border bg-background/95 p-3 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Review
                </p>
                <p className="text-sm font-medium">{artifact.metadata.title}</p>
              </div>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => setIsReviewOpen(false)}
              >
                Close
              </Button>
            </div>
            {actionError ? (
              <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {actionError}
              </Card>
            ) : null}

            <Card className="grid grid-cols-3 gap-1 p-1">
              {(
                [
                  { id: 'review', label: 'Review', count: openThreads.length },
                  {
                    id: 'revisions',
                    label: 'Revisions',
                    count: artifact.revisions.length,
                  },
                  { id: 'feedback', label: 'Agent', count: openThreads.length },
                ] as const
              ).map(({ id, label, count }) => (
                <button
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-medium transition',
                    activeSidebarTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                  key={id}
                  type="button"
                  onClick={() => setActiveSidebarTab(id)}
                >
                  {label}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              ))}
            </Card>

            {activeSidebarTab === 'review' ? (
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
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => setIsPlacingComment((current) => !current)}
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {pendingAnchor
                      ? `Placed at ${Math.round(pendingAnchor.x)}%, ${Math.round(
                          pendingAnchor.y,
                        )}%`
                      : isPlacingComment
                        ? 'Click on artifact to place'
                        : 'Place comment on artifact'}
                  </Button>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none ring-ring focus:ring-2"
                    placeholder="Anchor label, e.g. hero, chart, timeline row (optional)"
                    value={anchorLabel}
                    onChange={(event) => {
                      setAnchorLabel(event.target.value);
                      setPendingAnchor((current) =>
                        current
                          ? { ...current, label: event.target.value }
                          : undefined,
                      );
                    }}
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
                      No review threads yet. This artifact is ready for first
                      pass feedback.
                    </p>
                  ) : (
                    threads.map((thread, index) => (
                      <div
                        className={cn(
                          'rounded-lg border bg-card p-4 transition',
                          thread.id === activeThreadId
                            ? 'border-primary/60 ring-4 ring-primary/10'
                            : 'border-border',
                        )}
                        id={`thread-${thread.id}`}
                        key={thread.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                {index + 1}
                              </span>
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
                            </div>
                            <h3 className="mt-3 text-sm font-medium leading-5">
                              {thread.title}
                            </h3>
                          </div>
                          <button
                            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            type="button"
                            onClick={() => selectThread(thread.id)}
                          >
                            <MessageSquareText className="h-4 w-4" />
                          </button>
                        </div>
                        {thread.requestedChange ? (
                          <p className="mt-3 rounded-md bg-secondary/50 p-3 text-xs leading-5 text-muted-foreground">
                            {thread.requestedChange}
                          </p>
                        ) : null}
                        {thread.anchor ? (
                          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                            anchor: {thread.anchor.label}
                          </p>
                        ) : null}
                        <div className="mt-3 space-y-3">
                          {thread.comments.map((comment) => (
                            <div key={comment.id} className="text-sm">
                              <p className="font-medium">
                                {comment.author.name}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {comment.body}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                          {thread.status !== 'resolved' ? (
                            <Button
                              disabled={
                                pendingAction === `status-${thread.id}-resolved`
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateThreadStatus(thread.id, 'resolved')
                              }
                            >
                              Resolve
                            </Button>
                          ) : (
                            <Button
                              disabled={
                                pendingAction === `status-${thread.id}-open`
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateThreadStatus(thread.id, 'open')
                              }
                            >
                              Reopen
                            </Button>
                          )}
                          {thread.status !== 'needs-revision' ? (
                            <Button
                              disabled={
                                pendingAction ===
                                `status-${thread.id}-needs-revision`
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() =>
                                updateThreadStatus(thread.id, 'needs-revision')
                              }
                            >
                              Needs revision
                            </Button>
                          ) : null}
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
            ) : null}

            {activeSidebarTab === 'revisions' ? (
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
                    className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none ring-ring focus:ring-2"
                    value={revisionHtml}
                    onChange={(event) => setRevisionHtml(event.target.value)}
                  />
                  {threads.filter((thread) => thread.status !== 'resolved')
                    .length ? (
                    <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
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
                        className="block w-full rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50"
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
            ) : null}

            {activeSidebarTab === 'feedback' ? (
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Agent feedback bundle</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Copy unresolved review feedback into an agent so it can
                  produce the next self-contained HTML revision.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => copyFeedback(feedbackPrompt, 'prompt')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedBundle === 'prompt' ? 'Copied' : 'Copy prompt'}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => copyFeedback(feedbackJson, 'json')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedBundle === 'json' ? 'Copied' : 'Copy JSON'}
                  </Button>
                </div>
                <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Open threads
                    </p>
                    <Badge tone={openThreads.length ? 'warning' : 'success'}>
                      {openThreads.length}
                    </Badge>
                  </div>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-background p-3 font-mono text-[11px] leading-5 text-muted-foreground">
                    {feedbackPrompt}
                  </pre>
                </div>
              </Card>
            ) : null}
          </aside>
        </>
      ) : null}
    </div>
  );
}
