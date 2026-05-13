'use client';

import {
  type Artifact,
  type ArtifactKind,
  type ArtifactVisibility,
  type CreateArtifactInput,
  slugifyArtifactTitle,
} from '@docscn/sdk';

const STORAGE_KEY = 'docscn.local-artifacts';

export function readLocalArtifacts(): Artifact[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Artifact[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalArtifacts(artifacts: Artifact[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(artifacts));
}

export function getLocalArtifact(idOrSlug: string) {
  return readLocalArtifacts().find(
    (artifact) => artifact.id === idOrSlug || artifact.slug === idOrSlug,
  );
}

export function createLocalArtifact(input: CreateArtifactInput): Artifact {
  const now = new Date().toISOString();
  const slugBase = slugifyArtifactTitle(input.title) || 'untitled-artifact';
  const id = `local-${Date.now()}`;

  return {
    id,
    slug: `${slugBase}-${id.slice(-5)}`,
    currentRevisionId: `${id}-rev-1`,
    metadata: {
      title: input.title,
      description: input.description,
      visibility: input.visibility as ArtifactVisibility,
      kind: input.kind as ArtifactKind,
      source: input.source,
      tags: ['local', 'published'],
      createdAt: now,
      author: {
        id: `local-author-${slugifyArtifactTitle(input.authorName) || 'agent'}`,
        name: input.authorName,
        role: input.source === 'web' ? 'human' : 'agent',
        avatarFallback: input.authorName.slice(0, 2).toUpperCase() || 'AI',
      },
    },
    revisions: [
      {
        id: `${id}-rev-1`,
        version: 1,
        summary: 'Published locally from the docscn MVP flow.',
        html: input.html,
        createdAt: now,
        author: {
          id: `local-author-${slugifyArtifactTitle(input.authorName) || 'agent'}`,
          name: input.authorName,
          role: input.source === 'web' ? 'human' : 'agent',
          avatarFallback: input.authorName.slice(0, 2).toUpperCase() || 'AI',
        },
        changeRequestIds: [],
      },
    ],
  };
}

export function publishLocalArtifact(input: CreateArtifactInput) {
  const artifact = createLocalArtifact(input);
  const artifacts = [artifact, ...readLocalArtifacts()];
  writeLocalArtifacts(artifacts);

  return {
    artifact,
    result: {
      artifactId: artifact.id,
      slug: artifact.slug,
      url: `/artifacts/${artifact.slug}`,
      revisionId: artifact.currentRevisionId,
    },
  };
}
