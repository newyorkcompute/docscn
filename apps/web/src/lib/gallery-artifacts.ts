import type { Artifact } from '@docscn/sdk';
import { exampleArtifacts, getExampleArtifact } from './example-artifacts';
import { readExampleArtifactHtml } from './example-artifacts.server';

const galleryAuthor = {
  id: 'agent-docscn-gallery',
  name: 'docscn gallery',
  role: 'agent' as const,
  avatarFallback: 'dg',
};

export function isGalleryArtifact(artifact: Artifact) {
  return artifact.metadata.tags.includes('starter-demo');
}

export async function findGalleryArtifact(
  idOrSlug: string,
): Promise<Artifact | undefined> {
  const example = getExampleArtifact(idOrSlug);

  if (!example) {
    return undefined;
  }

  const html = await readExampleArtifactHtml(example.filename);
  const revisionId = `gallery-rev-${example.id}`;
  const createdAt = '2026-05-01T12:00:00.000Z';

  return {
    id: `gallery-${example.id}`,
    slug: example.id,
    currentRevisionId: revisionId,
    metadata: {
      title: example.title,
      description: example.description,
      author: galleryAuthor,
      createdAt,
      visibility: 'public',
      kind: example.kind,
      tags: ['starter-demo', 'gallery'],
      source: 'automation',
    },
    revisions: [
      {
        id: revisionId,
        version: 1,
        summary: 'Starter demo from the example gallery.',
        html,
        createdAt,
        author: galleryAuthor,
        changeRequestIds: [],
      },
    ],
  };
}

export function getGalleryArtifactHref(exampleId: string) {
  return `/artifacts/${exampleId}`;
}

export const galleryExampleIds = exampleArtifacts.map((example) => example.id);
