import type {
  Actor,
  AgentFeedbackBundle,
  Artifact,
  ReviewThread,
} from '@docscn/sdk';

const cursorAgent: Actor = {
  id: 'agent-cursor',
  name: 'Cursor agent',
  role: 'agent',
  handle: 'cursor',
  avatarFallback: 'CA',
};

const claudeAgent: Actor = {
  id: 'agent-claude',
  name: 'Claude build analyst',
  role: 'agent',
  handle: 'claude',
  avatarFallback: 'CL',
};

const maya: Actor = {
  id: 'human-maya',
  name: 'Maya Chen',
  role: 'human',
  handle: 'maya',
  avatarFallback: 'MC',
};

const sid: Actor = {
  id: 'human-sid',
  name: 'Sid',
  role: 'human',
  handle: 'sid',
  avatarFallback: 'S',
};

const incidentTimelineHtml = String.raw`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui; color: #e5f8ff; background: #071016; }
      main { padding: 32px; }
      .grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; }
      .card { border: 1px solid #254453; border-radius: 20px; padding: 20px; background: linear-gradient(135deg, #0d1c25, #101820); }
      .event { display: grid; grid-template-columns: 82px 1fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid #203642; }
      .time { color: #5eead4; font-family: ui-monospace, monospace; }
      .sev { display: inline-flex; border: 1px solid #fb7185; color: #fecdd3; border-radius: 999px; padding: 4px 10px; font-size: 12px; }
      button { background: #5eead4; border: 0; border-radius: 10px; padding: 10px 14px; color: #021014; font-weight: 700; cursor: pointer; }
      .hidden { display: none; }
      .metric { font-size: 42px; letter-spacing: -0.05em; }
    </style>
  </head>
  <body>
    <main>
      <p class="sev">sev-2 generated incident report</p>
      <h1>Checkout latency regression: 47 minute timeline</h1>
      <div class="grid">
        <section class="card">
          <div class="event"><strong class="time">09:04</strong><span>Agent detected p95 checkout latency crossing 2.8s after deploy 8f31c2.</span></div>
          <div class="event"><strong class="time">09:12</strong><span>Redis cache hit rate fell from 92% to 41% in us-east-1.</span></div>
          <div class="event"><strong class="time">09:27</strong><span>Rollback started after synthetic checkout failed three consecutive probes.</span></div>
          <div class="event"><strong class="time">09:51</strong><span>Latency recovered. Action item: add circuit breaker around enrichment job.</span></div>
        </section>
        <aside class="card">
          <p>Impact window</p>
          <div class="metric">47m</div>
          <p>Estimated failed checkouts: <strong>183</strong></p>
          <button onclick="document.querySelector('#details').classList.toggle('hidden')">toggle agent evidence</button>
          <pre id="details" class="hidden">redis.get(product:v2) timeout
queue depth: 18,402
region: us-east-1</pre>
        </aside>
      </div>
    </main>
  </body>
</html>`;

const migrationPlanHtml = String.raw`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; background: #0a0a0a; color: #f5f5f5; font-family: ui-sans-serif, system-ui; }
      main { padding: 34px; }
      .lanes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .lane { min-height: 280px; border: 1px solid #2f2f2f; border-radius: 18px; padding: 16px; background: #141414; }
      .step { margin-top: 12px; border: 1px solid #3f3f46; border-radius: 14px; padding: 12px; background: #1f1f23; }
      .risk { color: #fbbf24; font-family: ui-monospace, monospace; font-size: 12px; }
      .ok { color: #5eead4; }
    </style>
  </head>
  <body>
    <main>
      <p class="risk">agent-generated migration plan</p>
      <h1>Next.js 16 cache migration</h1>
      <p>Replace unstable cache boundaries with tagged cache components while preserving rollout safety.</p>
      <section class="lanes">
        <div class="lane"><h2>1. inventory</h2><div class="step">Map every unstable_cache callsite</div><div class="step">Group by tag ownership</div></div>
        <div class="lane"><h2>2. convert</h2><div class="step">Add use cache directives</div><div class="step">Port cacheLife profiles</div></div>
        <div class="lane"><h2>3. verify</h2><div class="step">Replay production paths</div><div class="step">Compare hit/miss ratios</div></div>
        <div class="lane"><h2>4. ship</h2><div class="step ok">Gate by env flag</div><div class="step ok">Remove legacy wrapper</div></div>
      </section>
    </main>
  </body>
</html>`;

const dashboardHtml = String.raw`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; color: #ecfeff; background: linear-gradient(135deg, #082f49, #111827); font-family: ui-sans-serif, system-ui; }
      main { padding: 30px; }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .card { padding: 18px; border-radius: 18px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); }
      .big { font-size: 46px; letter-spacing: -0.06em; }
      .bar { height: 120px; display: flex; align-items: end; gap: 8px; }
      .bar span { flex: 1; border-radius: 8px 8px 0 0; background: #67e8f9; }
    </style>
  </head>
  <body>
    <main>
      <h1>Agent evaluation dashboard</h1>
      <p>Generated from 1,284 eval traces and support-ticket feedback.</p>
      <section class="cards">
        <div class="card"><p>task success</p><div class="big">82%</div><small>+9% from last run</small></div>
        <div class="card"><p>review loops</p><div class="big">1.7</div><small>median comments to accepted revision</small></div>
        <div class="card"><p>unsafe HTML blocked</p><div class="big">14</div><small>needs sandbox policy review</small></div>
      </section>
      <div class="card" style="margin-top:14px"><h2>daily accepted artifacts</h2><div class="bar"><span style="height:42%"></span><span style="height:58%"></span><span style="height:36%"></span><span style="height:76%"></span><span style="height:64%"></span><span style="height:88%"></span></div></div>
    </main>
  </body>
</html>`;

const prototypeHtml = String.raw`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; background: #fafafa; color: #111827; font-family: ui-sans-serif, system-ui; }
      main { display: grid; place-items: center; min-height: 100vh; }
      .phone { width: 320px; border: 10px solid #111827; border-radius: 38px; background: white; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,.25); }
      .screen { padding: 18px; }
      .card { border-radius: 22px; padding: 18px; background: #ecfeff; margin: 10px 0; transition: transform .2s; }
      .card:hover { transform: translateY(-4px) rotate(-1deg); }
      button { width: 100%; border: 0; border-radius: 16px; padding: 14px; background: #111827; color: white; font-weight: 800; }
    </style>
  </head>
  <body>
    <main>
      <div class="phone">
        <div class="screen">
          <p>generated UI prototype</p>
          <h1>artifact inbox</h1>
          <div class="card">PR review heatmap ready for review</div>
          <div class="card">RAG pipeline explainer needs revision</div>
          <div class="card">Incident report accepted by on-call</div>
          <button onclick="alert('Prototype click captured for revision context')">publish selected</button>
        </div>
      </div>
    </main>
  </body>
</html>`;

const annotationThemeTestHtml = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --fg: #0f172a;
        --muted: #64748b;
        --panel: rgba(255, 255, 255, 0.86);
        --panel-strong: #ffffff;
        --border: rgba(15, 23, 42, 0.14);
        --accent: #1677ff;
        --accent-soft: rgba(22, 119, 255, 0.12);
        --shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
      }

      @media (prefers-color-scheme: dark) {
        :root:not(.light):not(.dark) {
          color-scheme: dark;
          --bg: #061019;
          --fg: #e5f0ff;
          --muted: #91a4b7;
          --panel: rgba(10, 25, 38, 0.78);
          --panel-strong: #0b1722;
          --border: rgba(148, 163, 184, 0.22);
          --accent: #4f9cff;
          --accent-soft: rgba(79, 156, 255, 0.18);
          --shadow: 0 24px 90px rgba(0, 0, 0, 0.45);
        }
      }

      html.dark,
      html[data-docscn-theme='dark'] {
        color-scheme: dark;
        --bg: #061019;
        --fg: #e5f0ff;
        --muted: #91a4b7;
        --panel: rgba(10, 25, 38, 0.78);
        --panel-strong: #0b1722;
        --border: rgba(148, 163, 184, 0.22);
        --accent: #4f9cff;
        --accent-soft: rgba(79, 156, 255, 0.18);
        --shadow: 0 24px 90px rgba(0, 0, 0, 0.45);
      }

      html.light,
      html[data-docscn-theme='light'] {
        color-scheme: light;
        --bg: #f8fafc;
        --fg: #0f172a;
        --muted: #64748b;
        --panel: rgba(255, 255, 255, 0.86);
        --panel-strong: #ffffff;
        --border: rgba(15, 23, 42, 0.14);
        --accent: #1677ff;
        --accent-soft: rgba(22, 119, 255, 0.12);
        --shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, var(--accent-soft), transparent 34rem),
          linear-gradient(135deg, var(--bg), color-mix(in oklab, var(--bg), var(--accent) 5%));
        color: var(--fg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        display: grid;
        min-height: 100vh;
        gap: 28px;
        padding: 48px;
      }

      .hero {
        display: grid;
        max-width: 1080px;
        gap: 16px;
      }

      .eyebrow {
        color: var(--accent);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 980px;
        margin: 0;
        font-size: clamp(40px, 7vw, 92px);
        letter-spacing: -0.06em;
        line-height: 0.92;
      }

      .lede {
        max-width: 860px;
        color: var(--muted);
        font-size: clamp(18px, 2vw, 24px);
        line-height: 1.5;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .card {
        display: flex;
        min-height: 250px;
        flex-direction: column;
        justify-content: space-between;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--panel);
        padding: 28px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }

      .card h2 {
        margin: 0;
        font-size: 26px;
        letter-spacing: -0.03em;
      }

      .card p {
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }

      .metric {
        font-size: 64px;
        font-weight: 760;
        letter-spacing: -0.06em;
      }

      .pill {
        display: inline-flex;
        width: max-content;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 800;
        padding: 10px 14px;
      }

      .timeline {
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--panel-strong);
      }

      .row {
        display: grid;
        grid-template-columns: 110px 1fr auto;
        align-items: center;
        gap: 18px;
        border-top: 1px solid var(--border);
        padding: 20px 24px;
      }

      .row:first-child {
        border-top: 0;
      }

      .time {
        color: var(--accent);
        font-variant-numeric: tabular-nums;
        font-weight: 900;
      }

      .row strong {
        display: block;
        margin-bottom: 4px;
      }

      .row span {
        color: var(--muted);
      }

      button.demo {
        cursor: pointer;
        border: 0;
        border-radius: 14px;
        background: var(--accent);
        color: white;
        font-weight: 800;
        padding: 12px 16px;
      }

      @media (max-width: 860px) {
        main {
          padding: 28px;
        }

        .grid,
        .row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero" data-docscn-label="hero summary">
        <div class="eyebrow">docscn theme + annotation test</div>
        <h1>Toggle the toolbar theme, then annotate this artifact.</h1>
        <p class="lede">
          This HTML is self-contained and responds to <strong>html.dark</strong>,
          <strong>html.light</strong>, <strong>data-docscn-theme</strong>, and
          <strong>prefers-color-scheme</strong>. Select this sentence for text
          annotation, or choose element mode and hover the cards below.
        </p>
      </section>

      <section class="grid">
        <article class="card" data-docscn-label="Theme probe card">
          <div>
            <h2>Theme probe</h2>
            <p>This card should visibly switch between light and dark when you use the docscn toolbar theme control.</p>
          </div>
          <div class="pill">uses .light / .dark</div>
        </article>
        <article class="card" data-docscn-label="Element annotation card">
          <div>
            <h2>Element annotation</h2>
            <p>Switch to the pointer tool, hover this card, confirm the blue outline, then click to attach a comment to this element.</p>
          </div>
          <button class="demo" data-docscn-label="Demo action button">Try element mode</button>
        </article>
        <article class="card" data-docscn-label="Text selection card">
          <div>
            <h2>Text annotation</h2>
            <p>Select this exact paragraph while the text tool is active. The comment composer should appear near the selected text and preserve the quoted text.</p>
          </div>
          <div class="metric">3 modes</div>
        </article>
      </section>

      <section class="timeline" data-docscn-label="Incident timeline table">
        <div class="row" data-docscn-label="Detection row">
          <div class="time">09:12</div>
          <div><strong>Regression detected</strong><span>Checkout p95 latency moved from 480ms to 2.8s after deploy 8f31c2.</span></div>
          <button class="demo">Inspect</button>
        </div>
        <div class="row" data-docscn-label="Rollback row">
          <div class="time">09:24</div>
          <div><strong>Rollback started</strong><span>The on-call agent generated this timeline and marked the suspect payment enrichment step.</span></div>
          <button class="demo">Annotate</button>
        </div>
        <div class="row" data-docscn-label="Recovery row">
          <div class="time">09:59</div>
          <div><strong>Recovery confirmed</strong><span>Use point comments for arbitrary spots, text comments for copy, and element comments for cards or rows.</span></div>
          <button class="demo">Resolve</button>
        </div>
      </section>
    </main>
  </body>
</html>`;

export const mockArtifacts: Artifact[] = [
  {
    id: 'artifact-annotation-theme-test',
    slug: 'docscn-annotation-theme-test',
    currentRevisionId: 'rev-annotation-theme-test-1',
    metadata: {
      title: 'docscn annotation and theme test',
      description:
        'Purpose-built local artifact for testing light/dark theme sync plus point, text, and element annotations.',
      author: cursorAgent,
      createdAt: '2026-05-14T23:50:00.000Z',
      visibility: 'public',
      kind: 'custom-html',
      tags: ['annotations', 'theme', 'test'],
      source: 'cursor',
    },
    revisions: [
      {
        id: 'rev-annotation-theme-test-1',
        version: 1,
        summary: 'Stable local test artifact for annotation and theme QA.',
        html: annotationThemeTestHtml,
        createdAt: '2026-05-14T23:50:00.000Z',
        author: cursorAgent,
        changeRequestIds: [],
      },
    ],
  },
  {
    id: 'artifact-incident-timeline',
    slug: 'checkout-latency-incident-timeline',
    currentRevisionId: 'rev-incident-2',
    metadata: {
      title: 'Checkout latency incident timeline',
      description:
        'A generated, interactive post-incident review with evidence, impact, and follow-up actions.',
      author: claudeAgent,
      createdAt: '2026-05-08T14:04:00.000Z',
      visibility: 'public',
      kind: 'incident-timeline',
      tags: ['incident', 'timeline', 'on-call'],
      source: 'scheduled-report',
    },
    revisions: [
      {
        id: 'rev-incident-1',
        version: 1,
        summary: 'Initial timeline generated from traces and deploy events.',
        html: incidentTimelineHtml,
        createdAt: '2026-05-08T14:04:00.000Z',
        author: claudeAgent,
        changeRequestIds: [],
      },
      {
        id: 'rev-incident-2',
        version: 2,
        summary: 'Added customer impact and Redis evidence after review.',
        html: incidentTimelineHtml,
        createdAt: '2026-05-08T15:18:00.000Z',
        author: claudeAgent,
        changeRequestIds: ['thread-impact'],
      },
    ],
  },
  {
    id: 'artifact-cache-migration',
    slug: 'nextjs-16-cache-migration-plan',
    currentRevisionId: 'rev-migration-1',
    metadata: {
      title: 'Next.js 16 cache migration plan',
      description:
        'A migration plan artifact with stages, risks, and review checkpoints for cache components.',
      author: cursorAgent,
      createdAt: '2026-05-10T19:32:00.000Z',
      visibility: 'unlisted',
      kind: 'migration-plan',
      tags: ['migration', 'nextjs', 'cache'],
      source: 'cursor',
    },
    revisions: [
      {
        id: 'rev-migration-1',
        version: 1,
        summary: 'Generated implementation plan from repository scan.',
        html: migrationPlanHtml,
        createdAt: '2026-05-10T19:32:00.000Z',
        author: cursorAgent,
        changeRequestIds: [],
      },
    ],
  },
  {
    id: 'artifact-eval-dashboard',
    slug: 'agent-evaluation-dashboard',
    currentRevisionId: 'rev-dashboard-1',
    metadata: {
      title: 'Agent evaluation dashboard',
      description:
        'A live-feeling generated dashboard summarizing eval outcomes and review-loop quality.',
      author: cursorAgent,
      createdAt: '2026-05-11T11:20:00.000Z',
      visibility: 'private',
      kind: 'generated-dashboard',
      tags: ['evals', 'dashboard', 'quality'],
      source: 'automation',
    },
    revisions: [
      {
        id: 'rev-dashboard-1',
        version: 1,
        summary: 'First dashboard artifact generated from eval traces.',
        html: dashboardHtml,
        createdAt: '2026-05-11T11:20:00.000Z',
        author: cursorAgent,
        changeRequestIds: [],
      },
    ],
  },
  {
    id: 'artifact-inbox-prototype',
    slug: 'artifact-inbox-mobile-prototype',
    currentRevisionId: 'rev-prototype-1',
    metadata: {
      title: 'Artifact inbox mobile prototype',
      description:
        'A generated UI prototype for triaging artifact review requests on mobile.',
      author: claudeAgent,
      createdAt: '2026-05-12T16:41:00.000Z',
      visibility: 'public',
      kind: 'ui-prototype',
      tags: ['prototype', 'mobile', 'review'],
      source: 'claude',
    },
    revisions: [
      {
        id: 'rev-prototype-1',
        version: 1,
        summary: 'Clickable mobile concept for artifact review inbox.',
        html: prototypeHtml,
        createdAt: '2026-05-12T16:41:00.000Z',
        author: claudeAgent,
        changeRequestIds: [],
      },
    ],
  },
];

export const mockReviewThreads: ReviewThread[] = [
  {
    id: 'thread-impact',
    artifactId: 'artifact-incident-timeline',
    revisionId: 'rev-incident-2',
    status: 'needs-revision',
    title: 'Add clearer user-facing impact',
    anchor: { label: 'Impact window card', selector: '.metric' },
    requestedChange:
      'Include affected checkout count and whether payments were retried automatically.',
    comments: [
      {
        id: 'comment-impact-1',
        body: 'The timeline is useful, but the agent should revise this with customer impact in the first screen.',
        author: maya,
        createdAt: '2026-05-08T15:26:00.000Z',
        role: 'human',
      },
      {
        id: 'comment-impact-2',
        body: 'Revision request captured. I will add failed checkout estimate, retry behavior, and owner.',
        author: claudeAgent,
        createdAt: '2026-05-08T15:29:00.000Z',
        role: 'agent',
      },
    ],
  },
  {
    id: 'thread-rollout',
    artifactId: 'artifact-cache-migration',
    revisionId: 'rev-migration-1',
    status: 'open',
    title: 'Split rollout by cache tag owner',
    anchor: { label: 'Ship lane' },
    requestedChange:
      'Turn the final lane into owner-specific rollout groups so each team can review their own cache tags.',
    comments: [
      {
        id: 'comment-rollout-1',
        body: 'This reads like a good plan, but agents need explicit owners before they can safely generate PRs.',
        author: sid,
        createdAt: '2026-05-10T20:02:00.000Z',
        role: 'human',
      },
    ],
  },
  {
    id: 'thread-dashboard',
    artifactId: 'artifact-eval-dashboard',
    revisionId: 'rev-dashboard-1',
    status: 'resolved',
    title: 'Accepted after adding blocked HTML metric',
    anchor: { label: 'Metric cards' },
    comments: [
      {
        id: 'comment-dashboard-1',
        body: 'The safety metric makes this useful for the weekly agent quality review.',
        author: maya,
        createdAt: '2026-05-11T12:04:00.000Z',
        role: 'human',
      },
    ],
  },
];

export function getArtifacts() {
  return mockArtifacts;
}

export function getArtifactById(idOrSlug: string) {
  return mockArtifacts.find(
    (artifact) => artifact.id === idOrSlug || artifact.slug === idOrSlug,
  );
}

export function getReviewThreads(artifactId: string) {
  return mockReviewThreads.filter((thread) => thread.artifactId === artifactId);
}

export function getAgentFeedbackBundle(
  artifactId: string,
  revisionId: string,
): AgentFeedbackBundle {
  return {
    artifactId,
    revisionId,
    openThreads: mockReviewThreads
      .filter(
        (thread) =>
          thread.artifactId === artifactId &&
          thread.revisionId === revisionId &&
          thread.status !== 'resolved',
      )
      .map((thread) => ({
        id: thread.id,
        title: thread.title,
        requestedChange: thread.requestedChange,
        comments: thread.comments.map((comment) => comment.body),
        anchor: thread.anchor,
      })),
  };
}
