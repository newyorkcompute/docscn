'use client';

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock3,
  Copy,
  GitCommitHorizontal,
  MessageCircle,
  MousePointer2,
  MessageSquareText,
  PanelRightOpen,
  Type,
} from 'lucide-react';
import type {
  Artifact,
  ArtifactRevision,
  ReviewAnchor,
  ReviewThread,
  ReviewThreadStatus,
} from '@docscn/sdk';
import { Badge, Button, Card, Eyebrow, Shell, cn } from '@docscn/ui';
import {
  ArtifactFrame,
  type ArtifactAnnotationEvent,
  type ArtifactAnnotationMode,
  type ArtifactViewportState,
} from './artifact-frame';
import { ThemeToggle } from './theme-toggle';

interface PendingAnchor extends ReviewAnchor {
  kind: NonNullable<ReviewAnchor['kind']>;
  x: number;
  y: number;
}

function getAnchorPoint(thread: ReviewThread, index: number) {
  if (
    typeof thread.anchor?.x === 'number' &&
    typeof thread.anchor?.y === 'number'
  ) {
    return {
      x: Math.min(Math.max(thread.anchor.x, 0), 100),
      y: Math.min(Math.max(thread.anchor.y, 0), 100),
    };
  }

  return {
    x: 68 + (index % 3) * 8,
    y: 18 + (index % 6) * 11,
  };
}

function getViewportPoint(
  point: { x: number; y: number },
  viewport?: ArtifactViewportState,
) {
  if (!viewport) {
    return {
      x: Math.min(Math.max(point.x, 6), 94),
      y: Math.min(Math.max(point.y, 8), 92),
    };
  }

  return {
    x:
      (((point.x / 100) * viewport.scrollWidth - viewport.scrollX) /
        Math.max(viewport.viewportWidth, 1)) *
      100,
    y:
      (((point.y / 100) * viewport.scrollHeight - viewport.scrollY) /
        Math.max(viewport.viewportHeight, 1)) *
      100,
  };
}

function getDocumentPoint(
  point: { x: number; y: number },
  viewport?: ArtifactViewportState,
) {
  if (!viewport) {
    return point;
  }

  return {
    x:
      (((point.x / 100) * viewport.viewportWidth + viewport.scrollX) /
        Math.max(viewport.scrollWidth, 1)) *
      100,
    y:
      (((point.y / 100) * viewport.viewportHeight + viewport.scrollY) /
        Math.max(viewport.scrollHeight, 1)) *
      100,
  };
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function getPinPosition(
  thread: ReviewThread,
  index: number,
  viewport?: ArtifactViewportState,
) {
  const point = getViewportPoint(getAnchorPoint(thread, index), viewport);

  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  };
}

function isAnchorVisible(
  thread: ReviewThread,
  index: number,
  viewport?: ArtifactViewportState,
) {
  const point = getViewportPoint(getAnchorPoint(thread, index), viewport);

  return point.x >= -5 && point.x <= 105 && point.y >= -5 && point.y <= 105;
}

function getPopoverPoint(
  thread: ReviewThread,
  index: number,
  viewport?: ArtifactViewportState,
) {
  const point = getViewportPoint(getAnchorPoint(thread, index), viewport);

  return {
    x: Math.min(Math.max(point.x, 4), 96),
    y: Math.min(Math.max(point.y, 6), 94),
  };
}

function getAnchorSummary(anchor?: ReviewAnchor) {
  if (!anchor) {
    return undefined;
  }

  if (anchor.kind === 'text' && anchor.quote) {
    return `"${anchor.quote.slice(0, 120)}${anchor.quote.length > 120 ? '...' : ''}"`;
  }

  if (anchor.kind === 'element') {
    return anchor.elementLabel || anchor.selector || anchor.label;
  }

  return anchor.label;
}

function ToolbarTip({
  align = 'center',
  children,
  label,
}: {
  align?: 'center' | 'right';
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="group relative flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-full border border-white/10 bg-neutral-950 px-2.5 py-1 text-xs text-white opacity-0 shadow-lg shadow-black/20 transition group-hover:opacity-100 group-focus-within:opacity-100',
          align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </div>
  );
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
  const reviewAuthor = 'Sid';
  const reviewStatus: ReviewThreadStatus = 'needs-revision';
  const [activeDrawerView, setActiveDrawerView] = useState<
    'review' | 'revisions'
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
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  const [activeThreadPopoverId, setActiveThreadPopoverId] = useState<
    string | undefined
  >();
  const [annotationMode, setAnnotationMode] =
    useState<ArtifactAnnotationMode>('idle');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [artifactViewport, setArtifactViewport] =
    useState<ArtifactViewportState>();
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

  const annotationBridgeId = useMemo(
    () => `${artifactId}:${selectedRevision?.id ?? 'pending'}`,
    [artifactId, selectedRevision?.id],
  );

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

  const activeThreadPopover = useMemo(
    () => threads.find((thread) => thread.id === activeThreadPopoverId),
    [activeThreadPopoverId, threads],
  );

  const activeThreadPopoverIndex = useMemo(
    () => threads.findIndex((thread) => thread.id === activeThreadPopoverId),
    [activeThreadPopoverId, threads],
  );

  function selectThreadInDrawer(threadId: string) {
    setActiveDrawerView('review');
    setActiveThreadId(threadId);
    setActiveThreadPopoverId(undefined);
    setIsReviewOpen(true);
    window.setTimeout(() => {
      document
        .getElementById(`thread-${threadId}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  }

  function openThreadPopover(threadId: string) {
    if (isReviewOpen) {
      selectThreadInDrawer(threadId);
      setPendingAnchor(undefined);
      setAnnotationMode('idle');
      return;
    }

    setActiveThreadId(threadId);
    setActiveThreadPopoverId(threadId);
    setPendingAnchor(undefined);
    setAnnotationMode('idle');
    setIsReviewOpen(false);
  }

  function placeCommentAnchor(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportPoint = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
    const documentPoint = getDocumentPoint(viewportPoint, artifactViewport);
    const label = `Pin ${threads.length + 1}`;

    setPendingAnchor({
      kind: 'point',
      label,
      x: clampPercent(documentPoint.x),
      y: clampPercent(documentPoint.y),
    });
    setAnchorLabel(label);
    setActiveDrawerView('review');
    setIsReviewOpen(false);
    setActiveThreadPopoverId(undefined);
    setAnnotationMode('idle');
  }

  function handleArtifactAnnotation(annotation: ArtifactAnnotationEvent) {
    const label =
      annotation.kind === 'text' && annotation.quote
        ? `Text: "${annotation.quote.slice(0, 48)}${
            annotation.quote.length > 48 ? '...' : ''
          }"`
        : annotation.label || `Element ${threads.length + 1}`;

    setPendingAnchor({
      kind: annotation.kind,
      label,
      x: annotation.x,
      y: annotation.y,
      selector: annotation.selector,
      quote: annotation.quote,
      elementLabel: annotation.elementLabel,
      rect: annotation.rect,
    });
    setAnchorLabel(label);
    setReviewTitle(
      annotation.kind === 'text' ? 'Text comment' : 'Element comment',
    );
    setReviewBody('');
    setRequestedChange('');
    setActiveDrawerView('review');
    setIsReviewOpen(false);
    setActiveThreadPopoverId(undefined);
    setAnnotationMode('idle');
  }

  async function refreshAfterAction() {
    router.refresh();
  }

  function cancelPendingComment() {
    setPendingAnchor(undefined);
    setReviewBody('');
    setReviewTitle('');
    setRequestedChange('');
    setAnchorLabel('');
    setActionError(undefined);
    setAnnotationMode('idle');
  }

  async function createThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = reviewBody.trim();
    const title =
      reviewTitle.trim() ||
      pendingAnchor?.label ||
      anchorLabel.trim() ||
      'Pinned comment';
    const isPinComposer = event.currentTarget.dataset['source'] === 'pin';

    if (!artifact || !selectedRevision || !body) {
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
          title,
          body,
          authorName: reviewAuthor,
          status: reviewStatus,
          requestedChange: requestedChange.trim(),
          anchor: pendingAnchor,
          anchorLabel: pendingAnchor?.label ?? anchorLabel,
          anchorKind: pendingAnchor?.kind,
          anchorSelector: pendingAnchor?.selector,
          anchorQuote: pendingAnchor?.quote,
          anchorElementLabel: pendingAnchor?.elementLabel,
          anchorRect: pendingAnchor?.rect,
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
      setIsReviewOpen(isPinComposer ? false : isReviewOpen);
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (pendingAnchor) {
        event.preventDefault();
        setPendingAnchor(undefined);
        setReviewBody('');
        setReviewTitle('');
        setRequestedChange('');
        setAnchorLabel('');
        setActionError(undefined);
        setAnnotationMode('idle');
        return;
      }

      if (annotationMode !== 'idle') {
        event.preventDefault();
        setAnnotationMode('idle');
        return;
      }

      if (activeThreadPopoverId) {
        event.preventDefault();
        setActiveThreadPopoverId(undefined);
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeThreadPopoverId, annotationMode, pendingAnchor]);

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

  const sidebarWidthClass = 'md:right-[420px]';
  const artifactSurfaceClass = cn(
    'fixed inset-y-0 left-0 right-0 overflow-hidden transition-[right] duration-200',
    isReviewOpen && sidebarWidthClass,
  );
  const toolbarPositionClass = cn(
    'fixed bottom-4 z-40 transition-[right] duration-200',
    isReviewOpen ? 'right-4 md:right-[436px]' : 'right-4',
  );
  const activeThreadPopoverPoint =
    activeThreadPopover && activeThreadPopoverIndex >= 0
      ? getPopoverPoint(
          activeThreadPopover,
          activeThreadPopoverIndex,
          artifactViewport,
        )
      : undefined;
  const activeThreadPopoverVisible = Boolean(
    activeThreadPopover &&
      activeThreadPopoverIndex >= 0 &&
      isAnchorVisible(
        activeThreadPopover,
        activeThreadPopoverIndex,
        artifactViewport,
      ),
  );
  const pendingViewportPoint = pendingAnchor
    ? getViewportPoint(pendingAnchor, artifactViewport)
    : undefined;
  const pendingPopoverPoint = pendingViewportPoint
    ? {
        x: Math.min(Math.max(pendingViewportPoint.x, 4), 96),
        y: Math.min(Math.max(pendingViewportPoint.y, 6), 94),
      }
    : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className={artifactSurfaceClass}>
        <ArtifactFrame
          annotationBridgeId={annotationBridgeId}
          annotationMode={annotationMode}
          className="h-full rounded-none border-0 shadow-none"
          html={selectedRevision.html}
          iframeClassName="h-screen min-h-screen"
          showChrome={false}
          title={artifact.metadata.title}
          onAnnotation={handleArtifactAnnotation}
          onAnnotationCancel={() => setAnnotationMode('idle')}
          onViewportChange={setArtifactViewport}
        />
      </div>

      <div
        className={cn(
          toolbarPositionClass,
          'flex items-center gap-1 rounded-full border border-white/10 bg-neutral-950/90 p-1 text-white shadow-2xl shadow-black/20 backdrop-blur-xl',
        )}
      >
        <ToolbarTip label="Point comment">
          <Button
            aria-label="Place a point comment"
            className={cn(
              'h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white',
              annotationMode === 'point' && 'bg-white/15',
            )}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingAnchor(undefined);
              setActiveThreadPopoverId(undefined);
              setActionError(undefined);
              setActiveDrawerView('review');
              setIsReviewOpen(false);
              setAnnotationMode((current) =>
                current === 'point' ? 'idle' : 'point',
              );
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </ToolbarTip>
        <ToolbarTip label="Text annotation">
          <Button
            aria-label="Annotate selected text"
            className={cn(
              'h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white',
              annotationMode === 'text' && 'bg-white/15',
            )}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingAnchor(undefined);
              setActiveThreadPopoverId(undefined);
              setActionError(undefined);
              setIsReviewOpen(false);
              setAnnotationMode((current) =>
                current === 'text' ? 'idle' : 'text',
              );
            }}
          >
            <Type className="h-4 w-4" />
          </Button>
        </ToolbarTip>
        <ToolbarTip label="Element annotation">
          <Button
            aria-label="Annotate an element"
            className={cn(
              'h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white',
              annotationMode === 'element' && 'bg-white/15',
            )}
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingAnchor(undefined);
              setActiveThreadPopoverId(undefined);
              setActionError(undefined);
              setIsReviewOpen(false);
              setAnnotationMode((current) =>
                current === 'element' ? 'idle' : 'element',
              );
            }}
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
        </ToolbarTip>
        <div className="mx-1 h-5 w-px bg-white/15" />
        <ToolbarTip label={`Revision history: v${selectedRevision.version}`}>
          <Button
            aria-label={`Open revision history, currently version ${selectedRevision.version}`}
            className="h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              setActiveDrawerView('revisions');
              setIsReviewOpen(true);
            }}
          >
            <GitCommitHorizontal className="h-4 w-4" />
            <span className="text-xs">v{selectedRevision.version}</span>
          </Button>
        </ToolbarTip>
        <ToolbarTip align="right" label="Theme">
          <ThemeToggle
            className="h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white"
            showLabel={false}
          />
        </ToolbarTip>
        <div className="relative">
          <ToolbarTip
            align="right"
            label={`Review threads (${openThreads.length} open)`}
          >
            <Button
              aria-label={`Open review drawer, ${openThreads.length} open threads`}
              className={cn(
                'h-9 rounded-full px-3 text-white hover:bg-white/10 hover:text-white',
                isReviewOpen && 'bg-white/15',
              )}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                const isSwitchingViews = activeDrawerView !== 'review';
                setActiveDrawerView('review');
                setActiveThreadPopoverId(undefined);
                setIsReviewOpen((current) =>
                  isSwitchingViews ? true : !current,
                );
              }}
            >
              <MessageSquareText className="h-4 w-4" />
              <span className="sr-only">
                {isReviewOpen ? 'Hide review' : 'Review'}
              </span>
            </Button>
          </ToolbarTip>
          {openThreads.length ? (
            <span className="pointer-events-none absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {openThreads.length}
            </span>
          ) : null}
        </div>
      </div>

      {annotationMode === 'point' ? (
        <button
          aria-label="Place comment on artifact"
          className={cn(
            artifactSurfaceClass,
            'z-30 cursor-crosshair bg-primary/5',
          )}
          type="button"
          onClick={placeCommentAnchor}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setAnnotationMode('idle');
            }
          }}
        >
          <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs text-primary shadow-sm">
            Click anywhere on the artifact to place a comment
          </div>
        </button>
      ) : null}

      {annotationMode === 'text' || annotationMode === 'element' ? (
        <div className={cn(artifactSurfaceClass, 'pointer-events-none z-30')}>
          <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs text-primary shadow-sm">
            {annotationMode === 'text'
              ? 'Select text inside the artifact to comment'
              : 'Click an element inside the artifact to comment'}
          </div>
        </div>
      ) : null}

      {threads.length ? (
        <div className={cn(artifactSurfaceClass, 'pointer-events-none z-20')}>
          {threads.map((thread, index) => {
            if (!isAnchorVisible(thread, index, artifactViewport)) {
              return null;
            }

            const position = getPinPosition(thread, index, artifactViewport);

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
                onClick={() => openThreadPopover(thread.id)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      ) : null}

      {activeThreadPopover &&
      activeThreadPopoverPoint &&
      activeThreadPopoverVisible ? (
        <div
          className="fixed z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-neutral-950/95 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
          style={{
            left: `${activeThreadPopoverPoint.x}%`,
            top: `${activeThreadPopoverPoint.y}%`,
            transform: `translate(${
              activeThreadPopoverPoint.x > 62
                ? 'calc(-100% - 14px)'
                : '14px'
            }, ${
              activeThreadPopoverPoint.y > 58
                ? 'calc(-100% - 14px)'
                : '14px'
            })`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {activeThreadPopoverIndex + 1}
                </span>
                <Badge
                  tone={
                    activeThreadPopover.status === 'resolved'
                      ? 'success'
                      : activeThreadPopover.status === 'needs-revision'
                        ? 'warning'
                        : 'muted'
                  }
                >
                  {activeThreadPopover.status}
                </Badge>
              </div>
              <h3 className="mt-3 text-sm font-medium leading-5 text-white">
                {activeThreadPopover.title}
              </h3>
            </div>
            <button
              className="rounded-full px-2 py-1 text-xs text-white/55 hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => setActiveThreadPopoverId(undefined)}
            >
              Close
            </button>
          </div>
          {getAnchorSummary(activeThreadPopover.anchor) ? (
            <p className="mt-3 rounded-lg bg-white/10 p-3 text-xs leading-5 text-white/70">
              {getAnchorSummary(activeThreadPopover.anchor)}
            </p>
          ) : null}
          <div className="mt-3 max-h-36 space-y-3 overflow-auto">
            {activeThreadPopover.comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <p className="font-medium text-white">{comment.author.name}</p>
                <p className="mt-1 leading-5 text-white/65">{comment.body}</p>
              </div>
            ))}
          </div>
          <textarea
            className="mt-4 min-h-16 w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-primary"
            placeholder="Reply to this thread"
            value={commentBodies[activeThreadPopover.id] ?? ''}
            onChange={(event) =>
              setCommentBodies((current) => ({
                ...current,
                [activeThreadPopover.id]: event.target.value,
              }))
            }
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              className="rounded-full px-3 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => selectThreadInDrawer(activeThreadPopover.id)}
            >
              Open details
            </button>
            <Button
              className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              disabled={pendingAction === `comment-${activeThreadPopover.id}`}
              size="sm"
              type="button"
              onClick={() => addComment(activeThreadPopover.id)}
            >
              {pendingAction === `comment-${activeThreadPopover.id}`
                ? 'Adding...'
                : 'Reply'}
            </Button>
          </div>
        </div>
      ) : null}

      {pendingAnchor && pendingViewportPoint ? (
        <div className={cn(artifactSurfaceClass, 'pointer-events-none z-30')}>
          <button
            aria-label="Pending comment pin"
            className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-background bg-primary text-xs font-semibold text-primary-foreground shadow-sm ring-4 ring-primary/15"
            style={{
              left: `${pendingViewportPoint.x}%`,
              top: `${pendingViewportPoint.y}%`,
            }}
            type="button"
          >
            +
          </button>
        </div>
      ) : null}

      {pendingAnchor && pendingPopoverPoint && !isReviewOpen ? (
        <form
          className="fixed z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-neutral-950/95 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
          data-source="pin"
          style={{
            left: `${pendingPopoverPoint.x}%`,
            top: `${pendingPopoverPoint.y}%`,
            transform: `translate(${
              pendingPopoverPoint.x > 62 ? 'calc(-100% - 14px)' : '14px'
            }, ${
              pendingPopoverPoint.y > 58 ? 'calc(-100% - 14px)' : '14px'
            })`,
          }}
          onSubmit={createThread}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate font-mono text-xs text-white/60">
              {getAnchorSummary(pendingAnchor) ||
                anchorLabel ||
                pendingAnchor.label}
            </p>
            <button
              className="rounded-full px-2 py-1 text-xs text-white/55 hover:bg-white/10 hover:text-white"
              type="button"
              onClick={cancelPendingComment}
            >
              Cancel
            </button>
          </div>
          <textarea
            autoFocus
            className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-primary"
            placeholder="What should change?"
            value={reviewBody}
            onChange={(event) => setReviewBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                cancelPendingComment();
              }
            }}
          />
          {actionError ? (
            <p className="mt-2 text-xs text-red-300">{actionError}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              className="rounded-full px-3 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white"
              type="button"
              onClick={cancelPendingComment}
            >
              Cancel
            </button>
            <Button
              className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              disabled={pendingAction === 'thread' || !reviewBody.trim()}
              size="sm"
              type="submit"
            >
              {pendingAction === 'thread' ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      ) : null}

      {isReviewOpen ? (
        <>
          <aside className="fixed bottom-0 right-0 top-0 z-50 w-full space-y-4 overflow-y-auto border-l border-border bg-background p-4 shadow-2xl shadow-black/10 md:w-[420px]">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {activeDrawerView === 'review' ? 'Review' : 'Revisions'}
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

            {activeDrawerView === 'review' ? (
              <section className="px-1">
                <div className="flex items-center gap-2">
                  <PanelRightOpen className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">Review threads</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Read, reply, and resolve comments. Add new feedback from the
                  canvas tools.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="mr-1 font-medium">Agent context</span>
                  <Button
                    className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => copyFeedback(feedbackPrompt, 'prompt')}
                  >
                    <Copy className="h-3 w-3" />
                    {copiedBundle === 'prompt' ? 'Copied' : 'Prompt'}
                  </Button>
                  <Button
                    className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => copyFeedback(feedbackJson, 'json')}
                  >
                    <Copy className="h-3 w-3" />
                    {copiedBundle === 'json' ? 'Copied' : 'JSON'}
                  </Button>
                </div>
                <div className="mt-5 divide-y divide-border">
                  {threads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No review threads yet. This artifact is ready for first
                      pass feedback.
                    </p>
                  ) : (
                    threads.map((thread, index) => (
                      <div
                        className={cn(
                          'py-5 transition',
                          thread.id === activeThreadId
                            ? 'rounded-lg bg-primary/5 px-3 ring-1 ring-primary/20'
                            : '',
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
                            onClick={() => selectThreadInDrawer(thread.id)}
                          >
                            <MessageSquareText className="h-4 w-4" />
                          </button>
                        </div>
                        {thread.requestedChange ? (
                          <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs leading-5 text-muted-foreground">
                            {thread.requestedChange}
                          </p>
                        ) : null}
                        {thread.anchor ? (
                          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                            anchor: {getAnchorSummary(thread.anchor)}
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
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                          {thread.status !== 'resolved' ? (
                            <Button
                              className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                              disabled={
                                pendingAction === `status-${thread.id}-resolved`
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                updateThreadStatus(thread.id, 'resolved')
                              }
                            >
                              Resolve
                            </Button>
                          ) : (
                            <Button
                              className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                              disabled={
                                pendingAction === `status-${thread.id}-open`
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                updateThreadStatus(thread.id, 'open')
                              }
                            >
                              Reopen
                            </Button>
                          )}
                          {thread.status !== 'needs-revision' ? (
                            <Button
                              className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                              disabled={
                                pendingAction ===
                                `status-${thread.id}-needs-revision`
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
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
                            className="min-h-16 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none ring-ring focus:ring-2"
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
                            className="h-7 rounded-full px-2 text-xs text-muted-foreground"
                            disabled={pendingAction === `comment-${thread.id}`}
                            size="sm"
                            type="button"
                            variant="ghost"
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
              </section>
            ) : null}

            {activeDrawerView === 'revisions' ? (
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
          </aside>
        </>
      ) : null}
    </div>
  );
}
