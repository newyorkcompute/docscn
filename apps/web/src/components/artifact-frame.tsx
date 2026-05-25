'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReviewAnchor } from '@docscn/sdk';
import { cn } from '@docscn/ui';

export type ArtifactAnnotationMode = 'idle' | 'point' | 'text' | 'element';
type ArtifactTheme = 'light' | 'dark';

export interface ArtifactAnnotationEvent {
  kind: 'text' | 'element';
  label: string;
  x: number;
  y: number;
  selector?: string;
  quote?: string;
  elementLabel?: string;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ArtifactViewportState {
  scrollX: number;
  scrollY: number;
  scrollWidth: number;
  scrollHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ArtifactFocusAnchor {
  x: number;
  y: number;
  requestId: number;
}

function buildAnnotationBridgeScript(
  bridgeId: string,
  initialMode: ArtifactAnnotationMode,
  initialTheme: ArtifactTheme,
) {
  return `
(() => {
  const bridgeId = ${JSON.stringify(bridgeId)};
  let mode = ${JSON.stringify(initialMode)};
  const initialTheme = ${JSON.stringify(initialTheme)};
  let highlightedElement;

  let pinHighlightedElement;

  const style = document.createElement('style');
  style.textContent = \`
    [data-docscn-element-hover] {
      outline: 2px solid #1677ff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.18) !important;
      cursor: crosshair !important;
    }
    [data-docscn-pin-highlight] {
      outline: 2px solid #f97316 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.15) !important;
      transition: outline-color 150ms, box-shadow 150ms !important;
    }
  \`;
  document.head.appendChild(style);

  function clearHighlight() {
    if (highlightedElement) {
      highlightedElement.removeAttribute('data-docscn-element-hover');
      highlightedElement = undefined;
    }
  }

  function setMode(nextMode) {
    mode = nextMode || 'idle';
    document.documentElement.dataset.docscnAnnotationMode = mode;

    if (mode !== 'element') {
      clearHighlight();
    }
  }

  function setTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
    document.documentElement.dataset.docscnTheme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    if (document.body) {
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(nextTheme);
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function asPercent(value, total) {
    return clamp((value / Math.max(total, 1)) * 100, 0, 100);
  }

  function viewportMetrics() {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth || doc.clientWidth || 1;
    const viewportHeight = window.innerHeight || doc.clientHeight || 1;

    return {
      scrollX: window.scrollX || doc.scrollLeft || 0,
      scrollY: window.scrollY || doc.scrollTop || 0,
      scrollWidth: Math.max(doc.scrollWidth || 0, body ? body.scrollWidth || 0 : 0, viewportWidth),
      scrollHeight: Math.max(doc.scrollHeight || 0, body ? body.scrollHeight || 0 : 0, viewportHeight),
      viewportWidth,
      viewportHeight,
    };
  }

  function rectToAnchor(rect) {
    const metrics = viewportMetrics();

    return {
      x: asPercent(rect.left + metrics.scrollX + rect.width / 2, metrics.scrollWidth),
      y: asPercent(rect.top + metrics.scrollY + rect.height / 2, metrics.scrollHeight),
      rect: {
        x: asPercent(rect.left + metrics.scrollX, metrics.scrollWidth),
        y: asPercent(rect.top + metrics.scrollY, metrics.scrollHeight),
        width: asPercent(rect.width, metrics.scrollWidth),
        height: asPercent(rect.height, metrics.scrollHeight),
      },
    };
  }

  function escapeSelectorPart(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }

    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
  }

  function elementSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return undefined;
    }

    if (element.id) {
      return '#' + escapeSelectorPart(element.id);
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let part = current.tagName.toLowerCase();

      if (current.classList && current.classList.length) {
        part += '.' + Array.from(current.classList).slice(0, 2).map(escapeSelectorPart).join('.');
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (sibling) => sibling.tagName === current.tagName,
        );

        if (siblings.length > 1) {
          part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
        }
      }

      parts.unshift(part);
      current = parent;

      if (parts.length >= 5) {
        break;
      }
    }

    return parts.join(' > ') || undefined;
  }

  function elementLabel(element) {
    const explicit =
      element.getAttribute('aria-label') ||
      element.getAttribute('data-docscn-label') ||
      element.getAttribute('title') ||
      element.id ||
      Array.from(element.classList || []).slice(0, 2).join('.');
    const text = (element.textContent || '').replace(/\\s+/g, ' ').trim();
    const fallback = text ? text.slice(0, 48) : element.tagName.toLowerCase();

    return explicit || fallback;
  }

  function send(annotation) {
    window.parent.postMessage(
      {
        type: 'docscn:annotation',
        bridgeId,
        annotation,
      },
      '*',
    );
  }

  function sendViewport() {
    window.parent.postMessage(
      {
        type: 'docscn:viewport',
        bridgeId,
        viewport: viewportMetrics(),
      },
      '*',
    );
  }

  function scrollToAnchor(anchor) {
    const metrics = viewportMetrics();
    const targetX = (anchor.x / 100) * metrics.scrollWidth - metrics.viewportWidth / 2;
    const targetY = (anchor.y / 100) * metrics.scrollHeight - metrics.viewportHeight / 2;

    window.scrollTo({
      left: clamp(targetX, 0, Math.max(metrics.scrollWidth - metrics.viewportWidth, 0)),
      top: clamp(targetY, 0, Math.max(metrics.scrollHeight - metrics.viewportHeight, 0)),
      behavior: 'smooth',
    });

    scheduleViewport();
    window.setTimeout(scheduleViewport, 260);
  }

  let viewportFrame = 0;

  function scheduleViewport() {
    if (viewportFrame) {
      return;
    }

    viewportFrame = window.requestAnimationFrame(() => {
      viewportFrame = 0;
      sendViewport();
    });
  }

  function cancelAnnotationMode() {
    setMode('idle');
    window.parent.postMessage(
      {
        type: 'docscn:annotation-cancel',
        bridgeId,
      },
      '*',
    );
  }

  function clearPinHighlight() {
    if (pinHighlightedElement) {
      pinHighlightedElement.removeAttribute('data-docscn-pin-highlight');
      pinHighlightedElement = undefined;
    }
  }

  function highlightAnchor(anchor) {
    clearPinHighlight();

    if (anchor && anchor.selector) {
      try {
        const target = document.querySelector(anchor.selector);

        if (target) {
          pinHighlightedElement = target;
          target.setAttribute('data-docscn-pin-highlight', 'true');
          return;
        }
      } catch (_) {
        // invalid selector
      }
    }

    if (anchor && anchor.quote) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      const snippet = anchor.quote.slice(0, 80);
      let node;

      while ((node = walker.nextNode())) {
        if (node.textContent && node.textContent.includes(snippet)) {
          const parent = node.parentElement;

          if (parent) {
            pinHighlightedElement = parent;
            parent.setAttribute('data-docscn-pin-highlight', 'true');
          }

          return;
        }
      }
    }
  }

  window.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'docscn:set-annotation-mode' && data.bridgeId === bridgeId) {
      setMode(data.mode);
    }

    if (data.type === 'docscn:set-artifact-theme' && data.bridgeId === bridgeId) {
      setTheme(data.theme);
    }

    if (data.type === 'docscn:request-viewport' && data.bridgeId === bridgeId) {
      scheduleViewport();
    }

    if (data.type === 'docscn:focus-anchor' && data.bridgeId === bridgeId && data.anchor) {
      scrollToAnchor(data.anchor);
    }

    if (data.type === 'docscn:highlight-anchor' && data.bridgeId === bridgeId) {
      if (data.anchor) {
        highlightAnchor(data.anchor);
      } else {
        clearPinHighlight();
      }
    }
  });

  setMode(mode);
  setTheme(initialTheme);
  sendViewport();
  window.setTimeout(sendViewport, 0);

  window.addEventListener('scroll', scheduleViewport, { passive: true });
  window.addEventListener('resize', scheduleViewport);

  if (window.ResizeObserver) {
    if (window.__docscnResizeObserver) {
      window.__docscnResizeObserver.disconnect();
    }

    window.__docscnResizeObserver = new ResizeObserver(scheduleViewport);

    window.__docscnResizeObserver.observe(document.documentElement);

    if (document.body) {
      window.__docscnResizeObserver.observe(document.body);
    }
  }

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && mode !== 'idle') {
        event.preventDefault();
        cancelAnnotationMode();
      }
    },
    true,
  );

  document.addEventListener(
    'mouseover',
    (event) => {
      if (mode !== 'element') {
        return;
      }

      const target = event.target;

      if (!target || target.nodeType !== Node.ELEMENT_NODE || target === document.documentElement || target === document.body) {
        return;
      }

      if (highlightedElement === target) {
        return;
      }

      clearHighlight();
      highlightedElement = target;
      highlightedElement.setAttribute('data-docscn-element-hover', 'true');
    },
    true,
  );

  document.addEventListener(
    'mouseout',
    (event) => {
      if (mode !== 'element' || !highlightedElement) {
        return;
      }

      const nextTarget = event.relatedTarget;

      if (nextTarget && highlightedElement.contains(nextTarget)) {
        return;
      }

      clearHighlight();
    },
    true,
  );

  document.addEventListener(
    'mouseup',
    () => {
      window.setTimeout(() => {
        if (mode !== 'text') {
          return;
        }

        const selection = window.getSelection();
        const quote = selection ? selection.toString().trim() : '';

        if (!selection || !quote || selection.rangeCount === 0) {
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (!rect.width && !rect.height) {
          return;
        }

        send({
          kind: 'text',
          label: 'Text: "' + quote.slice(0, 48) + (quote.length > 48 ? '...' : '') + '"',
          quote,
          selector: elementSelector(range.commonAncestorContainer.parentElement || document.body),
          ...rectToAnchor(rect),
        });
      }, 0);
    },
    true,
  );

  document.addEventListener(
    'click',
    (event) => {
      if (mode !== 'element') {
        return;
      }

      const target = event.target;

      if (!target || target.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = target.getBoundingClientRect();
      const label = elementLabel(target);

      clearHighlight();

      send({
        kind: 'element',
        label,
        selector: elementSelector(target),
        elementLabel: label,
        ...rectToAnchor(rect),
      });
    },
    true,
  );
})();
`;
}

function buildArtifactThemeBootScript(initialTheme: ArtifactTheme) {
  return `
(() => {
  const theme = ${JSON.stringify(initialTheme)};
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.dataset.docscnTheme = theme;
  root.style.colorScheme = theme;
})();
`;
}

function injectAnnotationBridge(
  html: string,
  bridgeId: string | undefined,
  annotationMode: ArtifactAnnotationMode,
  initialTheme: ArtifactTheme,
) {
  if (!bridgeId) {
    return html;
  }

  const themeScript = `<script>${buildArtifactThemeBootScript(
    initialTheme,
  ).replace(/<\/script/gi, '<\\/script')}</script>`;
  const script = `<script>${buildAnnotationBridgeScript(
    bridgeId,
    annotationMode,
    initialTheme,
  ).replace(/<\/script/gi, '<\\/script')}</script>`;
  const themedHtml = /<head([^>]*)>/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>${themeScript}`)
    : `${themeScript}${html}`;

  return /<\/body>/i.test(themedHtml)
    ? themedHtml.replace(/<\/body>/i, `${script}</body>`)
    : `${themedHtml}${script}`;
}

function getResolvedArtifactTheme(): ArtifactTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const root = document.documentElement;

  if (root.classList.contains('dark')) {
    return 'dark';
  }

  if (root.classList.contains('light')) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ArtifactFrame({
  html,
  title,
  className,
  iframeClassName,
  showChrome = true,
  annotationBridgeId,
  annotationMode = 'idle',
  focusAnchor,
  highlightedAnchor,
  viewportRequestId,
  onAnnotation,
  onAnnotationCancel,
  onViewportChange,
}: {
  html: string;
  title: string;
  className?: string;
  iframeClassName?: string;
  showChrome?: boolean;
  annotationBridgeId?: string;
  annotationMode?: ArtifactAnnotationMode;
  focusAnchor?: ArtifactFocusAnchor;
  highlightedAnchor?: ReviewAnchor;
  viewportRequestId?: number;
  onAnnotation?: (annotation: ArtifactAnnotationEvent) => void;
  onAnnotationCancel?: () => void;
  onViewportChange?: (viewport: ArtifactViewportState) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [initialArtifactTheme, setInitialArtifactTheme] = useState<
    ArtifactTheme | undefined
  >();
  const srcDoc = useMemo(
    () =>
      initialArtifactTheme
        ? injectAnnotationBridge(
            html,
            annotationBridgeId,
            annotationMode,
            initialArtifactTheme,
          )
        : '',
    [annotationBridgeId, annotationMode, html, initialArtifactTheme],
  );

  function postAnnotationMode() {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'docscn:set-annotation-mode',
        bridgeId: annotationBridgeId,
        mode: annotationMode,
      },
      '*',
    );
  }

  function postArtifactTheme(
    theme: ArtifactTheme = getResolvedArtifactTheme(),
  ) {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'docscn:set-artifact-theme',
        bridgeId: annotationBridgeId,
        theme,
      },
      '*',
    );
  }

  function postViewportRequest() {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'docscn:request-viewport',
        bridgeId: annotationBridgeId,
      },
      '*',
    );
  }

  function postHighlightAnchor(anchor?: ReviewAnchor) {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'docscn:highlight-anchor',
        bridgeId: annotationBridgeId,
        anchor: anchor
          ? { selector: anchor.selector, quote: anchor.quote }
          : null,
      },
      '*',
    );
  }

  function postFocusAnchor(anchor: ArtifactFocusAnchor) {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'docscn:focus-anchor',
        bridgeId: annotationBridgeId,
        anchor,
      },
      '*',
    );
  }

  useEffect(() => {
    setInitialArtifactTheme(getResolvedArtifactTheme());
  }, []);

  useEffect(() => {
    if (!annotationBridgeId) {
      return;
    }

    const handleAnnotation = onAnnotation;
    const handleAnnotationCancel = onAnnotationCancel;
    const handleViewportChange = onViewportChange;

    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data as
        | {
            type?: string;
            bridgeId?: string;
            annotation?: ArtifactAnnotationEvent;
            viewport?: ArtifactViewportState;
          }
        | undefined;

      if (
        data?.type === 'docscn:annotation' &&
        data.bridgeId === annotationBridgeId &&
        data.annotation
      ) {
        handleAnnotation?.(data.annotation);
      }

      if (
        data?.type === 'docscn:annotation-cancel' &&
        data.bridgeId === annotationBridgeId
      ) {
        handleAnnotationCancel?.();
      }

      if (
        data?.type === 'docscn:viewport' &&
        data.bridgeId === annotationBridgeId &&
        data.viewport
      ) {
        handleViewportChange?.(data.viewport);
      }
    }

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [annotationBridgeId, onAnnotation, onAnnotationCancel, onViewportChange]);

  useEffect(() => {
    postAnnotationMode();
  }, [annotationBridgeId, annotationMode]);

  useEffect(() => {
    if (!annotationBridgeId || !focusAnchor) {
      return;
    }

    postFocusAnchor(focusAnchor);
  }, [annotationBridgeId, focusAnchor]);

  useEffect(() => {
    if (!annotationBridgeId) {
      return;
    }

    postHighlightAnchor(highlightedAnchor);
  }, [annotationBridgeId, highlightedAnchor]);

  useEffect(() => {
    if (!annotationBridgeId || viewportRequestId == null) {
      return;
    }

    postViewportRequest();
    const t1 = window.setTimeout(postViewportRequest, 220);
    const t2 = window.setTimeout(postViewportRequest, 420);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [annotationBridgeId, viewportRequestId]);

  useEffect(() => {
    if (!annotationBridgeId) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function syncTheme() {
      postArtifactTheme();
    }

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    });
    mediaQuery.addEventListener('change', syncTheme);
    syncTheme();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', syncTheme);
    };
  }, [annotationBridgeId]);

  useEffect(() => {
    if (!annotationBridgeId) {
      return;
    }

    let frame = 0;

    function requestViewport() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        postViewportRequest();
      });
    }

    window.addEventListener('resize', requestViewport);
    window.visualViewport?.addEventListener('resize', requestViewport);
    window.visualViewport?.addEventListener('scroll', requestViewport);
    requestViewport();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener('resize', requestViewport);
      window.visualViewport?.removeEventListener('resize', requestViewport);
      window.visualViewport?.removeEventListener('scroll', requestViewport);
    };
  }, [annotationBridgeId]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-black/4',
        className,
      )}
    >
      {showChrome ? (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/10" />
          <span className="ml-3 truncate font-mono text-xs text-muted-foreground">
            sandboxed artifact / {title}
          </span>
        </div>
      ) : null}
      {initialArtifactTheme ? (
        <iframe
          className={cn('h-[680px] w-full bg-background', iframeClassName)}
          ref={iframeRef}
          sandbox="allow-scripts allow-forms"
          srcDoc={srcDoc}
          title={title}
          onLoad={() => {
            postAnnotationMode();
            postArtifactTheme();
            postViewportRequest();
            if (focusAnchor) {
              postFocusAnchor(focusAnchor);
            }
          }}
        />
      ) : (
        <div
          aria-label={`Loading ${title}`}
          className={cn('h-[680px] w-full bg-background', iframeClassName)}
          role="status"
        />
      )}
    </div>
  );
}
