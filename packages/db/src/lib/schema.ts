import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type {
  Actor,
  ArtifactKind,
  ArtifactVisibility,
  IntegrationSource,
  ReviewAnchor,
  ReviewThreadStatus,
} from '@docscn/sdk';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  createdAt: timestamp('created_at', {
    mode: 'string',
    withTimezone: true,
  }).notNull(),
  lastUsedAt: timestamp('last_used_at', {
    mode: 'string',
    withTimezone: true,
  }),
  revokedAt: timestamp('revoked_at', {
    mode: 'string',
    withTimezone: true,
  }),
});

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
  ownerUserId: text('owner_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
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
