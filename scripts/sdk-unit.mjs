import assert from 'node:assert/strict';

const {
  buildAgentFeedbackContext,
  formatAgentFeedbackJson,
  formatAgentFeedbackPrompt,
  slugifyArtifactTitle,
} = await import('../dist/packages/sdk/src/lib/sdk.js');

const fixtureArtifact = {
  id: 'artifact-incident-timeline',
  slug: 'checkout-latency-incident-timeline',
  currentRevisionId: 'rev-incident-2',
  metadata: {
    title: 'Checkout latency incident timeline',
    description: 'Incident review artifact.',
    author: {
      id: 'agent-claude',
      name: 'Claude',
      role: 'agent',
      avatarFallback: 'CL',
    },
    createdAt: '2026-05-08T14:04:00.000Z',
    visibility: 'public',
    kind: 'incident-timeline',
    tags: [],
    source: 'automation',
  },
  revisions: [
    {
      id: 'rev-incident-1',
      version: 1,
      summary: 'Initial timeline.',
      html: '<html></html>',
      createdAt: '2026-05-08T14:04:00.000Z',
      author: {
        id: 'agent-claude',
        name: 'Claude',
        role: 'agent',
        avatarFallback: 'CL',
      },
      changeRequestIds: [],
    },
    {
      id: 'rev-incident-2',
      version: 2,
      summary: 'Added customer impact.',
      html: '<html></html>',
      createdAt: '2026-05-08T15:18:00.000Z',
      author: {
        id: 'agent-claude',
        name: 'Claude',
        role: 'agent',
        avatarFallback: 'CL',
      },
      changeRequestIds: ['thread-impact'],
    },
  ],
};

const fixtureThreads = [
  {
    id: 'thread-impact',
    artifactId: 'artifact-incident-timeline',
    revisionId: 'rev-incident-2',
    status: 'needs-revision',
    title: 'Add clearer user-facing impact',
    requestedChange: 'Include affected checkout count.',
    comments: [
      {
        id: 'comment-impact-1',
        body: 'Add customer impact to the first screen.',
        author: {
          id: 'user-maya',
          name: 'Maya',
          role: 'human',
          avatarFallback: 'MY',
        },
        createdAt: '2026-05-08T15:26:00.000Z',
        role: 'human',
      },
      {
        id: 'comment-impact-2',
        body: 'Will add failed checkout estimate and owner.',
        author: {
          id: 'agent-claude',
          name: 'Claude',
          role: 'agent',
          avatarFallback: 'CL',
        },
        createdAt: '2026-05-08T15:29:00.000Z',
        role: 'agent',
      },
    ],
  },
  {
    id: 'thread-resolved',
    artifactId: 'artifact-incident-timeline',
    revisionId: 'rev-incident-2',
    status: 'resolved',
    title: 'Resolved thread',
    comments: [],
  },
  {
    id: 'thread-other-revision',
    artifactId: 'artifact-incident-timeline',
    revisionId: 'rev-incident-1',
    status: 'open',
    title: 'Old revision thread',
    comments: [],
  },
];

assert.equal(slugifyArtifactTitle('  Hello World!  '), 'hello-world');
assert.equal(slugifyArtifactTitle('---Already---Slug---'), 'already-slug');
assert.equal(slugifyArtifactTitle(''), '');
assert.equal(
  slugifyArtifactTitle('a'.repeat(120)).length,
  72,
  'slugify should cap length at 72 characters',
);

assert.equal(
  buildAgentFeedbackContext(
    fixtureArtifact,
    'rev-does-not-exist',
    fixtureThreads,
  ),
  undefined,
);

const feedbackContext = buildAgentFeedbackContext(
  fixtureArtifact,
  'rev-incident-2',
  fixtureThreads,
);
assert.ok(feedbackContext);
assert.equal(
  feedbackContext.artifact.title,
  'Checkout latency incident timeline',
);
assert.equal(feedbackContext.revision.version, 2);
assert.equal(feedbackContext.openThreads.length, 1);
assert.equal(feedbackContext.openThreads[0].id, 'thread-impact');
assert.equal(feedbackContext.openThreads[0].comments.length, 2);

const prompt = formatAgentFeedbackPrompt(feedbackContext);
assert.match(prompt, /Checkout latency incident timeline/);
assert.match(prompt, /revision v2/);
assert.match(prompt, /Add clearer user-facing impact/);
assert.match(prompt, /Maya \(human\): Add customer impact to the first screen/);
assert.match(prompt, /Return only a complete self-contained HTML document/);

const emptyPrompt = formatAgentFeedbackPrompt({
  ...feedbackContext,
  openThreads: [],
});
assert.match(
  emptyPrompt,
  /There are no open review threads/,
  'prompt should guide agents when no threads are open',
);

const parsed = JSON.parse(formatAgentFeedbackJson(feedbackContext));
assert.equal(parsed.artifact.slug, fixtureArtifact.slug);
assert.equal(parsed.instructions.constraints.length, 3);

console.log('sdk unit ok');
