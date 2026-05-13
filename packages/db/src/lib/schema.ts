import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type {
  Actor,
  ArtifactKind,
  ArtifactVisibility,
  IntegrationSource,
  ReviewAnchor,
  ReviewThreadStatus,
} from '@docscn/sdk';

export const artifacts = pgTable('artifacts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  author: jsonb('author').$type<Actor>().notNull(),
  createdAt: timestamp('created_at', {
    mode: 'string',
    withTimezone: true,
  }).notNull(),
  visibility: text('visibility').$type<ArtifactVisibility>().notNull(),
  kind: text('kind').$type<ArtifactKind>().notNull(),
  tags: jsonb('tags').$type<string[]>().notNull(),
  source: text('source').$type<IntegrationSource>().notNull(),
  currentRevisionId: text('current_revision_id').notNull(),
});

export const artifactRevisions = pgTable('artifact_revisions', {
  id: text('id').primaryKey(),
  artifactId: text('artifact_id')
    .notNull()
    .references(() => artifacts.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  summary: text('summary').notNull(),
  html: text('html').notNull(),
  htmlObjectKey: text('html_object_key'),
  createdAt: timestamp('created_at', {
    mode: 'string',
    withTimezone: true,
  }).notNull(),
  author: jsonb('author').$type<Actor>().notNull(),
  changeRequestIds: jsonb('change_request_ids').$type<string[]>().notNull(),
});

export const reviewThreads = pgTable('review_threads', {
  id: text('id').primaryKey(),
  artifactId: text('artifact_id')
    .notNull()
    .references(() => artifacts.id, { onDelete: 'cascade' }),
  revisionId: text('revision_id')
    .notNull()
    .references(() => artifactRevisions.id, { onDelete: 'cascade' }),
  status: text('status').$type<ReviewThreadStatus>().notNull(),
  title: text('title').notNull(),
  anchor: jsonb('anchor').$type<ReviewAnchor>(),
  requestedChange: text('requested_change'),
});

export const reviewComments = pgTable('review_comments', {
  id: text('id').primaryKey(),
  threadId: text('thread_id')
    .notNull()
    .references(() => reviewThreads.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  author: jsonb('author').$type<Actor>().notNull(),
  createdAt: timestamp('created_at', {
    mode: 'string',
    withTimezone: true,
  }).notNull(),
  role: text('role').$type<Actor['role']>().notNull(),
});
