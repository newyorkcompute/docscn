import assert from 'node:assert/strict';

const {
  getAgentFeedbackBundle,
  getArtifactById,
  getArtifacts,
  getReviewThreads,
  mockArtifacts,
} = await import('../dist/packages/db/src/lib/db.js');

const incidentArtifact = mockArtifacts.find(
  (artifact) => artifact.id === 'artifact-incident-timeline',
);
assert.ok(incidentArtifact);

assert.equal(
  getArtifactById('artifact-incident-timeline')?.id,
  'artifact-incident-timeline',
);
assert.equal(
  getArtifactById('checkout-latency-incident-timeline')?.slug,
  'checkout-latency-incident-timeline',
);
assert.equal(getArtifactById('missing-artifact'), undefined);
assert.ok(getArtifacts().length >= 4);

const incidentThreads = getReviewThreads('artifact-incident-timeline');
assert.equal(incidentThreads.length, 1);
assert.equal(incidentThreads[0].id, 'thread-impact');

const feedbackBundle = getAgentFeedbackBundle(
  'artifact-incident-timeline',
  'rev-incident-2',
);
assert.equal(feedbackBundle.artifactId, 'artifact-incident-timeline');
assert.equal(feedbackBundle.revisionId, 'rev-incident-2');
assert.equal(feedbackBundle.openThreads.length, 1);
assert.equal(
  feedbackBundle.openThreads[0].title,
  'Add clearer user-facing impact',
);
assert.equal(feedbackBundle.openThreads[0].comments.length, 2);

console.log('db unit ok');
