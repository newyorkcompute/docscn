import type { ArtifactKind } from '@docscn/sdk';
// eslint-disable-next-line @nx/enforce-module-boundaries -- Shared manifest is also fetched by the GitHub-backed CLI.
import templatesManifest from '../../../../examples/artifacts/templates.json';

export type ExampleArtifactCategoryId =
  | 'exploration-planning'
  | 'code-review-understanding'
  | 'design'
  | 'prototyping'
  | 'illustrations-diagrams'
  | 'decks'
  | 'research-learning'
  | 'reports'
  | 'custom-editors';

export interface ExampleArtifactCategory {
  id: ExampleArtifactCategoryId;
  title: string;
  description: string;
}

export interface ExampleArtifactDefinition {
  id: string;
  title: string;
  description: string;
  kind: ArtifactKind;
  filename: string;
  category: ExampleArtifactCategoryId;
  thumbnail?: string;
  source?: {
    label: string;
    href: string;
  };
}

interface ExampleArtifactManifest {
  categories: ExampleArtifactCategory[];
  templates: ExampleArtifactDefinition[];
}

const manifest = templatesManifest as ExampleArtifactManifest;

export const exampleArtifactCategories = manifest.categories;
export const exampleArtifacts = manifest.templates;

export function getExampleArtifact(id: string) {
  return exampleArtifacts.find((example) => example.id === id);
}
