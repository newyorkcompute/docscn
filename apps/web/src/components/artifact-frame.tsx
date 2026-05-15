'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

  const style = document.createElement('style');
  style.textContent = \`
    [data-docscn-element-hover] {
      outline: 2px solid #1677ff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.18) !important;
      cursor: crosshair !important;
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

  function rectToAnchor(rect) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

    return {
      x: asPercent(rect.left + rect.width / 2, viewportWidth),
      y: asPercent(rect.top + rect.height / 2, viewportHeight),
      rect: {
        x: asPercent(rect.left, viewportWidth),
        y: asPercent(rect.top, viewportHeight),
        width: asPercent(rect.width, viewportWidth),
        height: asPercent(rect.height, viewportHeight),
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

  window.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'docscn:set-annotation-mode' && data.bridgeId === bridgeId) {
      setMode(data.mode);
    }

    if (data.type === 'docscn:set-artifact-theme' && data.bridgeId === bridgeId) {
      setTheme(data.theme);
    }
  });

  setMode(mode);
  setTheme(initialTheme);

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
  onAnnotation,
  onAnnotationCancel,
}: {
  html: string;
  title: string;
  className?: string;
  iframeClassName?: string;
  showChrome?: boolean;
  annotationBridgeId?: string;
  annotationMode?: ArtifactAnnotationMode;
  onAnnotation?: (annotation: ArtifactAnnotationEvent) => void;
  onAnnotationCancel?: () => void;
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

  useEffect(() => {
    setInitialArtifactTheme(getResolvedArtifactTheme());
  }, []);

  useEffect(() => {
    if (!annotationBridgeId) {
      return;
    }

    const handleAnnotation = onAnnotation;
    const handleAnnotationCancel = onAnnotationCancel;

    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data as
        | {
            type?: string;
            bridgeId?: string;
            annotation?: ArtifactAnnotationEvent;
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
    }

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, [annotationBridgeId, onAnnotation, onAnnotationCancel]);

  useEffect(() => {
    postAnnotationMode();
  }, [annotationBridgeId, annotationMode]);

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
