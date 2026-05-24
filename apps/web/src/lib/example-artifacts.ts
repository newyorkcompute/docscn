import type { ArtifactKind } from '@docscn/sdk';

export interface ExampleArtifactDefinition {
  id: string;
  title: string;
  description: string;
  kind: ArtifactKind;
  filename: string;
}

export const exampleArtifacts: ExampleArtifactDefinition[] = [
  {
    id: 'minimal',
    title: 'Minimal publish test',
    description:
      'The smallest useful artifact for verifying CLI install, login, and publish.',
    kind: 'custom-html',
    filename: 'minimal.html',
  },
  {
    id: 'incident-timeline',
    title: 'Checkout latency incident timeline',
    description:
      'Dark incident report with timeline events, impact metrics, and toggleable evidence.',
    kind: 'incident-timeline',
    filename: 'incident-timeline.html',
  },
  {
    id: 'migration-plan',
    title: 'Next.js cache migration plan',
    description:
      'Four-lane migration board for converting cache boundaries with rollout safety.',
    kind: 'migration-plan',
    filename: 'migration-plan.html',
  },
  {
    id: 'eval-dashboard',
    title: 'Agent evaluation dashboard',
    description:
      'Generated dashboard with pass rate, latency, and scenario score table.',
    kind: 'generated-dashboard',
    filename: 'eval-dashboard.html',
  },
  {
    id: 'pr-review',
    title: 'PR review summary',
    description:
      'Review checklist, severity labels, and diff highlights for a sample pull request.',
    kind: 'pr-review',
    filename: 'pr-review.html',
  },
];

export function getExampleArtifact(id: string) {
  return exampleArtifacts.find((example) => example.id === id);
}

export function getExamplePublishCommand(origin: string, filename: string) {
  return `docscn publish examples/artifacts/${filename} --host ${origin}`;
}
