import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, isNull, lte, or } from 'drizzle-orm';
import type {
  Actor,
  AgentFeedbackBundle,
  ApiKey,
  ApiKeyPrincipal,
  Artifact,
  ArtifactRevision,
  ClaimArtifactsInput,
  ClaimArtifactsResult,
  CliLoginApproval,
  CliLoginPollResult,
  CliLoginRequest,
  CreatedApiKey,
  CreateApiKeyInput,
  CreateArtifactInput,
  CreateReviewCommentInput,
  CreateReviewThreadInput,
  PublishResult,
  ReviewComment,
  ReviewThread,
  SubmitRevisionInput,
  UpdateReviewThreadStatusInput,
} from '@docscn/sdk';
import { slugifyArtifactTitle } from '@docscn/sdk';
import { getArtifactStorage } from '@docscn/storage';
import { getDb, isDatabaseConfigured } from './client';
import {
  apiKeys,
  artifactClaims,
  artifactRevisions,
  artifacts,
  cliDeviceLogins,
  reviewComments,
  reviewThreads,
} from './schema';
import {
  getAgentFeedbackBundle as getMockAgentFeedbackBundle,
  getArtifactById as getMockArtifactById,
  getArtifacts as getMockArtifacts,
  getReviewThreads as getMockReviewThreads,
} from './db';

const runtimeArtifacts: Artifact[] = [];
const runtimeThreads: ReviewThread[] = [];
const runtimeArtifactClaims: Array<typeof artifactClaims.$inferSelect> = [];
const runtimeCliDeviceLogins: Array<
  typeof cliDeviceLogins.$inferSelect & { deviceCode: string }
> = [];
const apiKeyTokenPrefix = 'docscn_sk_';
const cliLoginTtlMs = 10 * 60 * 1000;
const cliLoginIntervalSeconds = 2;
const claimTokenPrefix = 'docscn_claim_';
const anonymousArtifactClaimTtlDays = 90;
const anonymousArtifactClaimTtlMs =
  anonymousArtifactClaimTtlDays * 24 * 60 * 60 * 1000;

interface ArtifactAccessOptions {
  includeUnlisted?: boolean;
  viewerUserId?: string | null;
}

function canViewArtifact(
  artifact: Artifact,
  options: ArtifactAccessOptions = {},
) {
  if (artifact.ownerUserId && artifact.ownerUserId === options.viewerUserId) {
    return true;
  }

  if (artifact.metadata.visibility === 'public') {
    return true;
  }

  return (
    artifact.metadata.visibility === 'unlisted' &&
    options.includeUnlisted === true
  );
}

export function canMutateArtifact(
  artifact: Artifact,
  viewerUserId?: string | null,
) {
  return Boolean(artifact.ownerUserId && artifact.ownerUserId === viewerUserId);
}

async function storeRevisionHtml(input: {
  artifactId: string;
  revisionId: string;
  html: string;
}): Promise<{ html: string; htmlObjectKey?: string }> {
  const storage = getArtifactStorage();

  if (!storage) {
    return { html: input.html };
  }

  const objectRef = await storage.putHtml(input);

  return {
    html: '',
    htmlObjectKey: objectRef.key,
  };
}

async function readRevisionHtml(input: {
  html: string;
  htmlObjectKey: string | null;
}) {
  if (!input.htmlObjectKey) {
    return input.html;
  }

  const storage = getArtifactStorage();

  if (!storage) {
    return input.html;
  }

  try {
    return await storage.getHtml(input.htmlObjectKey);
  } catch {
    return input.html;
  }
}

function createActorFromName(
  name: string,
  role: Actor['role'] = 'human',
): Actor {
  const trimmedName = name.trim() || 'Agent';
  return {
    id: `actor-${slugifyArtifactTitle(trimmedName) || 'agent'}`,
    name: trimmedName,
    role,
    avatarFallback: trimmedName.slice(0, 2).toUpperCase() || 'AI',
  };
}

function hashApiKey(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createApiKeyToken() {
  return `${apiKeyTokenPrefix}${randomBytes(32).toString('base64url')}`;
}

function createCliDeviceCode() {
  return `docscn_dc_${randomBytes(32).toString('base64url')}`;
}

function createCliUserCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

function hashCliDeviceCode(deviceCode: string) {
  return createHash('sha256').update(deviceCode).digest('hex');
}

function createClaimToken() {
  return `${claimTokenPrefix}${randomBytes(32).toString('base64url')}`;
}

function hashClaimToken(claimToken: string) {
  return createHash('sha256').update(claimToken).digest('hex');
}

function isExpired(expiresAt: string, nowMs = Date.now()) {
  return Date.parse(expiresAt) <= nowMs;
}

function getAnonymousClaimExpiresAt(createdAt: string) {
  return new Date(
    Date.parse(createdAt) + anonymousArtifactClaimTtlMs,
  ).toISOString();
}

function mapApiKeyRow(row: typeof apiKeys.$inferSelect): ApiKey {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    keyPrefix: row.keyPrefix,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt ?? undefined,
    revokedAt: row.revokedAt ?? undefined,
  };
}

function createPublishActor(input: CreateArtifactInput): Actor {
  return createActorFromName(
    input.authorName,
    input.source === 'web' ? 'human' : 'agent',
  );
}

function createPublishedArtifact(input: CreateArtifactInput): Artifact {
  const now = new Date().toISOString();
  const id = `artifact-${randomUUID()}`;
  const revisionId = `revision-${randomUUID()}`;
  const slugBase = slugifyArtifactTitle(input.title) || 'untitled-artifact';
  const author = createPublishActor(input);

  return {
    id,
    slug: `${slugBase}-${id.slice(-8)}`,
    ownerUserId: input.ownerUserId,
    currentRevisionId: revisionId,
    metadata: {
      title: input.title.trim(),
      description: input.description.trim(),
      author,
      createdAt: now,
      visibility: input.visibility,
      kind: input.kind,
      tags: ['published'],
      source: input.source,
    },
    revisions: [
      {
        id: revisionId,
        version: 1,
        summary: 'Published from docscn.',
        html: input.html,
        createdAt: now,
        author,
        changeRequestIds: [],
      },
    ],
  };
}

async function mapArtifactRows(
  artifactRows: (typeof artifacts.$inferSelect)[],
  revisionRows: (typeof artifactRevisions.$inferSelect)[],
): Promise<Artifact[]> {
  return Promise.all(
    artifactRows.map(async (artifact) => ({
      id: artifact.id,
      slug: artifact.slug,
      ownerUserId: artifact.ownerUserId ?? undefined,
      currentRevisionId: artifact.currentRevisionId,
      metadata: {
        title: artifact.title,
        description: artifact.description,
        author: artifact.author,
        createdAt: artifact.createdAt,
        visibility: artifact.visibility,
        kind: artifact.kind,
        tags: artifact.tags,
        source: artifact.source,
      },
      revisions: await Promise.all(
        revisionRows
          .filter((revision) => revision.artifactId === artifact.id)
          .sort((a, b) => a.version - b.version)
          .map<Promise<ArtifactRevision>>(async (revision) => ({
            id: revision.id,
            version: revision.version,
            summary: revision.summary,
            html: await readRevisionHtml({
              html: revision.html,
              htmlObjectKey: revision.htmlObjectKey,
            }),
            htmlObjectKey: revision.htmlObjectKey ?? undefined,
            createdAt: revision.createdAt,
            author: revision.author,
            changeRequestIds: revision.changeRequestIds,
          })),
      ),
    })),
  );
}

function mapThreadRows(
  threadRows: (typeof reviewThreads.$inferSelect)[],
  commentRows: (typeof reviewComments.$inferSelect)[],
): ReviewThread[] {
  return threadRows.map((thread) => ({
    id: thread.id,
    artifactId: thread.artifactId,
    revisionId: thread.revisionId,
    status: thread.status,
    title: thread.title,
    anchor: thread.anchor ?? undefined,
    requestedChange: thread.requestedChange ?? undefined,
    comments: commentRows
      .filter((comment) => comment.threadId === thread.id)
      .map<ReviewComment>((comment) => ({
        id: comment.id,
        body: comment.body,
        author: comment.author,
        createdAt: comment.createdAt,
        role: comment.role,
      })),
  }));
}

export async function createApiKey(
  input: CreateApiKeyInput,
): Promise<CreatedApiKey> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is required to create API keys.');
  }

  const token = createApiKeyToken();
  const now = new Date().toISOString();
  const row = {
    id: `api-key-${randomUUID()}`,
    userId: input.userId,
    name: input.name.trim(),
    keyPrefix: token.slice(0, 18),
    keyHash: hashApiKey(token),
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };

  await getDb().insert(apiKeys).values(row);

  return {
    apiKey: mapApiKeyRow(row),
    token,
  };
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));

  return rows.map(mapApiKeyRow);
}

export async function revokeApiKey(input: {
  apiKeyId: string;
  userId: string;
}): Promise<ApiKey | undefined> {
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  const revokedAt = new Date().toISOString();
  await getDb()
    .update(apiKeys)
    .set({ revokedAt })
    .where(
      and(eq(apiKeys.id, input.apiKeyId), eq(apiKeys.userId, input.userId)),
    );

  const rows = await getDb()
    .select()
    .from(apiKeys)
    .where(
      and(eq(apiKeys.id, input.apiKeyId), eq(apiKeys.userId, input.userId)),
    )
    .limit(1);

  return rows[0] ? mapApiKeyRow(rows[0]) : undefined;
}

export async function verifyApiKey(
  token: string,
): Promise<ApiKeyPrincipal | undefined> {
  if (!isDatabaseConfigured() || !token.startsWith(apiKeyTokenPrefix)) {
    return undefined;
  }

  const rows = await getDb()
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hashApiKey(token)))
    .limit(1);
  const row = rows[0];

  if (!row || row.revokedAt) {
    return undefined;
  }

  await getDb()
    .update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, row.id));

  return {
    apiKeyId: row.id,
    userId: row.userId,
    name: row.name,
  };
}

export async function createCliLoginRequest(): Promise<CliLoginRequest> {
  const deviceCode = createCliDeviceCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cliLoginTtlMs).toISOString();
  const row = {
    id: `cli-login-${randomUUID()}`,
    deviceCodeHash: hashCliDeviceCode(deviceCode),
    userCode: createCliUserCode(),
    createdAt: now.toISOString(),
    expiresAt,
    approvedUserId: null,
    approvedAt: null,
    consumedAt: null,
  };

  if (!isDatabaseConfigured()) {
    runtimeCliDeviceLogins.push({ ...row, deviceCode });
  } else {
    await getDb().insert(cliDeviceLogins).values(row);
  }

  return {
    deviceCode,
    userCode: row.userCode,
    expiresAt,
    intervalSeconds: cliLoginIntervalSeconds,
  };
}

export async function approveCliLoginRequest(input: {
  userCode: string;
  userId: string;
}): Promise<CliLoginApproval> {
  const normalizedUserCode = input.userCode.trim().toUpperCase();

  if (!isDatabaseConfigured()) {
    const pendingLogin = runtimeCliDeviceLogins.find(
      (login) => login.userCode === normalizedUserCode,
    );

    if (!pendingLogin) {
      return { userCode: normalizedUserCode, status: 'not-found' };
    }

    if (pendingLogin.consumedAt) {
      return { userCode: normalizedUserCode, status: 'already-consumed' };
    }

    if (isExpired(pendingLogin.expiresAt)) {
      return { userCode: normalizedUserCode, status: 'expired' };
    }

    pendingLogin.approvedUserId = input.userId;
    pendingLogin.approvedAt = new Date().toISOString();

    return { userCode: normalizedUserCode, status: 'approved' };
  }

  const rows = await getDb()
    .select()
    .from(cliDeviceLogins)
    .where(eq(cliDeviceLogins.userCode, normalizedUserCode))
    .limit(1);
  const pendingLogin = rows[0];

  if (!pendingLogin) {
    return { userCode: normalizedUserCode, status: 'not-found' };
  }

  if (pendingLogin.consumedAt) {
    return { userCode: normalizedUserCode, status: 'already-consumed' };
  }

  if (isExpired(pendingLogin.expiresAt)) {
    return { userCode: normalizedUserCode, status: 'expired' };
  }

  await getDb()
    .update(cliDeviceLogins)
    .set({
      approvedAt: new Date().toISOString(),
      approvedUserId: input.userId,
    })
    .where(eq(cliDeviceLogins.id, pendingLogin.id));

  return { userCode: normalizedUserCode, status: 'approved' };
}

export async function pollCliLoginRequest(
  deviceCode: string,
): Promise<CliLoginPollResult> {
  const deviceCodeHash = hashCliDeviceCode(deviceCode);

  if (!isDatabaseConfigured()) {
    const pendingLogin = runtimeCliDeviceLogins.find(
      (login) => login.deviceCode === deviceCode,
    );

    if (!pendingLogin) {
      return { status: 'not-found' };
    }

    if (pendingLogin.consumedAt) {
      return { status: 'already-consumed' };
    }

    if (isExpired(pendingLogin.expiresAt)) {
      return { status: 'expired' };
    }

    if (!pendingLogin.approvedUserId) {
      return { status: 'pending' };
    }

    pendingLogin.consumedAt = new Date().toISOString();
    const { apiKey, token } = await createApiKey({
      userId: pendingLogin.approvedUserId,
      name: 'docscn CLI',
    });

    return { status: 'approved', apiKey, token };
  }

  const rows = await getDb()
    .select()
    .from(cliDeviceLogins)
    .where(eq(cliDeviceLogins.deviceCodeHash, deviceCodeHash))
    .limit(1);
  const pendingLogin = rows[0];

  if (!pendingLogin) {
    return { status: 'not-found' };
  }

  if (pendingLogin.consumedAt) {
    return { status: 'already-consumed' };
  }

  if (isExpired(pendingLogin.expiresAt)) {
    return { status: 'expired' };
  }

  if (!pendingLogin.approvedUserId) {
    return { status: 'pending' };
  }

  await getDb()
    .update(cliDeviceLogins)
    .set({ consumedAt: new Date().toISOString() })
    .where(eq(cliDeviceLogins.id, pendingLogin.id));

  const { apiKey, token } = await createApiKey({
    userId: pendingLogin.approvedUserId,
    name: 'docscn CLI',
  });

  return { status: 'approved', apiKey, token };
}

export async function listArtifacts(
  options: ArtifactAccessOptions = {},
): Promise<Artifact[]> {
  if (!isDatabaseConfigured()) {
    return [...runtimeArtifacts, ...getMockArtifacts()].filter((artifact) =>
      canViewArtifact(artifact, options),
    );
  }

  const db = getDb();
  const [artifactRows, revisionRows] = await Promise.all([
    db.select().from(artifacts),
    db.select().from(artifactRevisions),
  ]);

  return (await mapArtifactRows(artifactRows, revisionRows)).filter(
    (artifact) => canViewArtifact(artifact, options),
  );
}

export async function findArtifact(
  idOrSlug: string,
  options: ArtifactAccessOptions = { includeUnlisted: true },
): Promise<Artifact | undefined> {
  const runtimeArtifact = runtimeArtifacts.find(
    (artifact) => artifact.id === idOrSlug || artifact.slug === idOrSlug,
  );

  if (runtimeArtifact) {
    return canViewArtifact(runtimeArtifact, {
      includeUnlisted: true,
      ...options,
    })
      ? runtimeArtifact
      : undefined;
  }

  if (!isDatabaseConfigured()) {
    const mockArtifact = getMockArtifactById(idOrSlug);
    return mockArtifact &&
      canViewArtifact(mockArtifact, { includeUnlisted: true, ...options })
      ? mockArtifact
      : undefined;
  }

  const db = getDb();
  const artifactRows = await db
    .select()
    .from(artifacts)
    .where(or(eq(artifacts.id, idOrSlug), eq(artifacts.slug, idOrSlug)))
    .limit(1);
  const artifact = artifactRows[0];

  if (!artifact) {
    return undefined;
  }

  const revisionRows = await db
    .select()
    .from(artifactRevisions)
    .where(eq(artifactRevisions.artifactId, artifact.id));

  const mappedArtifact = (await mapArtifactRows([artifact], revisionRows))[0];

  if (
    !mappedArtifact ||
    !canViewArtifact(mappedArtifact, { includeUnlisted: true, ...options })
  ) {
    return undefined;
  }

  return mappedArtifact;
}

export async function listReviewThreads(
  artifactId: string,
): Promise<ReviewThread[]> {
  if (!isDatabaseConfigured()) {
    return [
      ...runtimeThreads.filter((thread) => thread.artifactId === artifactId),
      ...getMockReviewThreads(artifactId),
    ];
  }

  const db = getDb();
  const threadRows = await db
    .select()
    .from(reviewThreads)
    .where(eq(reviewThreads.artifactId, artifactId));
  const commentRows = threadRows.length
    ? await db.select().from(reviewComments)
    : [];

  return mapThreadRows(threadRows, commentRows);
}

export async function publishArtifact(input: CreateArtifactInput): Promise<{
  artifact: Artifact;
  result: PublishResult;
}> {
  const artifact = createPublishedArtifact(input);
  const revision = artifact.revisions[0];
  const claimToken = input.ownerUserId ? undefined : createClaimToken();

  if (!revision) {
    throw new Error('Published artifact must include an initial revision.');
  }

  if (!isDatabaseConfigured()) {
    runtimeArtifacts.unshift(artifact);
    if (claimToken) {
      runtimeArtifactClaims.push({
        artifactId: artifact.id,
        claimTokenHash: hashClaimToken(claimToken),
        createdAt: artifact.metadata.createdAt,
        expiresAt: getAnonymousClaimExpiresAt(artifact.metadata.createdAt),
        claimedAt: null,
      });
    }

    return {
      artifact,
      result: {
        artifactId: artifact.id,
        slug: artifact.slug,
        url: `/artifacts/${artifact.slug}`,
        revisionId: revision.id,
        claimToken,
      },
    };
  }

  const db = getDb();
  const storedRevision = await storeRevisionHtml({
    artifactId: artifact.id,
    revisionId: revision.id,
    html: revision.html,
  });

  revision.htmlObjectKey = storedRevision.htmlObjectKey;
  await db.insert(artifacts).values({
    id: artifact.id,
    slug: artifact.slug,
    title: artifact.metadata.title,
    description: artifact.metadata.description,
    author: artifact.metadata.author,
    createdAt: artifact.metadata.createdAt,
    visibility: artifact.metadata.visibility,
    kind: artifact.metadata.kind,
    tags: artifact.metadata.tags,
    source: artifact.metadata.source,
    currentRevisionId: artifact.currentRevisionId,
    ownerUserId: artifact.ownerUserId,
  });
  await db.insert(artifactRevisions).values({
    id: revision.id,
    artifactId: artifact.id,
    version: revision.version,
    summary: revision.summary,
    html: storedRevision.html,
    htmlObjectKey: storedRevision.htmlObjectKey,
    createdAt: revision.createdAt,
    author: revision.author,
    changeRequestIds: revision.changeRequestIds,
  });
  if (claimToken) {
    await db.insert(artifactClaims).values({
      artifactId: artifact.id,
      claimTokenHash: hashClaimToken(claimToken),
      createdAt: artifact.metadata.createdAt,
      expiresAt: getAnonymousClaimExpiresAt(artifact.metadata.createdAt),
      claimedAt: null,
    });
  }

  return {
    artifact,
    result: {
      artifactId: artifact.id,
      slug: artifact.slug,
      url: `/artifacts/${artifact.slug}`,
      revisionId: revision.id,
      claimToken,
    },
  };
}

export async function claimAnonymousArtifacts(
  input: ClaimArtifactsInput,
): Promise<ClaimArtifactsResult> {
  const result: ClaimArtifactsResult = {
    claimed: [],
    skipped: [],
  };
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const nowMs = nowDate.getTime();

  if (!isDatabaseConfigured()) {
    for (const receipt of input.receipts) {
      const artifact = runtimeArtifacts.find(
        (candidate) => candidate.id === receipt.artifactId,
      );
      const claim = runtimeArtifactClaims.find(
        (candidate) => candidate.artifactId === receipt.artifactId,
      );

      if (!artifact) {
        result.skipped.push({
          artifactId: receipt.artifactId,
          reason: 'not-found',
        });
        continue;
      }

      if (artifact.ownerUserId) {
        result.skipped.push({
          artifactId: receipt.artifactId,
          reason: 'already-owned',
        });
        continue;
      }

      if (!claim) {
        result.skipped.push({
          artifactId: receipt.artifactId,
          reason: 'expired-token',
        });
        continue;
      }

      if (
        claim.claimedAt ||
        claim.claimTokenHash !== hashClaimToken(receipt.claimToken)
      ) {
        result.skipped.push({
          artifactId: receipt.artifactId,
          reason: 'invalid-token',
        });
        continue;
      }

      if (isExpired(claim.expiresAt, nowMs)) {
        result.skipped.push({
          artifactId: receipt.artifactId,
          reason: 'expired-token',
        });
        continue;
      }

      artifact.ownerUserId = input.userId;
      claim.claimedAt = now;
      result.claimed.push({
        artifactId: artifact.id,
        slug: artifact.slug,
      });
    }

    return result;
  }

  const db = getDb();

  for (const receipt of input.receipts) {
    const [artifact] = await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.id, receipt.artifactId))
      .limit(1);
    const [claim] = await db
      .select()
      .from(artifactClaims)
      .where(eq(artifactClaims.artifactId, receipt.artifactId))
      .limit(1);

    if (!artifact) {
      result.skipped.push({
        artifactId: receipt.artifactId,
        reason: 'not-found',
      });
      continue;
    }

    if (artifact.ownerUserId) {
      result.skipped.push({
        artifactId: receipt.artifactId,
        reason: 'already-owned',
      });
      continue;
    }

    if (!claim) {
      result.skipped.push({
        artifactId: receipt.artifactId,
        reason: 'expired-token',
      });
      continue;
    }

    if (
      claim.claimedAt ||
      claim.claimTokenHash !== hashClaimToken(receipt.claimToken)
    ) {
      result.skipped.push({
        artifactId: receipt.artifactId,
        reason: 'invalid-token',
      });
      continue;
    }

    if (isExpired(claim.expiresAt, nowMs)) {
      result.skipped.push({
        artifactId: receipt.artifactId,
        reason: 'expired-token',
      });
      continue;
    }

    await db
      .update(artifacts)
      .set({ ownerUserId: input.userId })
      .where(eq(artifacts.id, artifact.id));
    await db
      .update(artifactClaims)
      .set({ claimedAt: now })
      .where(eq(artifactClaims.artifactId, artifact.id));

    result.claimed.push({
      artifactId: artifact.id,
      slug: artifact.slug,
    });
  }

  return result;
}

async function cleanupExpiredAnonymousArtifactClaims(
  now: Date = new Date(),
): Promise<{ deletedClaims: number }> {
  const nowIso = now.toISOString();

  if (!isDatabaseConfigured()) {
    let deletedClaims = 0;

    for (let index = runtimeArtifactClaims.length - 1; index >= 0; index -= 1) {
      const claim = runtimeArtifactClaims[index];

      if (
        claim &&
        !claim.claimedAt &&
        isExpired(claim.expiresAt, now.getTime())
      ) {
        runtimeArtifactClaims.splice(index, 1);
        deletedClaims += 1;
      }
    }

    return { deletedClaims };
  }

  const deletedRows = await getDb()
    .delete(artifactClaims)
    .where(
      and(
        isNull(artifactClaims.claimedAt),
        lte(artifactClaims.expiresAt, nowIso),
      ),
    )
    .returning({ artifactId: artifactClaims.artifactId });

  return { deletedClaims: deletedRows.length };
}

export async function createReviewThread(
  input: CreateReviewThreadInput,
): Promise<ReviewThread> {
  const now = new Date().toISOString();
  const thread: ReviewThread = {
    id: `thread-${randomUUID()}`,
    artifactId: input.artifactId,
    revisionId: input.revisionId,
    status: input.status,
    title: input.title.trim(),
    requestedChange: input.requestedChange?.trim() || undefined,
    anchor: input.anchor,
    comments: [
      {
        id: `comment-${randomUUID()}`,
        body: input.body.trim(),
        author: createActorFromName(input.authorName, input.authorRole),
        createdAt: now,
        role: input.authorRole ?? 'human',
      },
    ],
  };

  if (!isDatabaseConfigured()) {
    runtimeThreads.unshift(thread);
    return thread;
  }

  const db = getDb();
  await db.insert(reviewThreads).values({
    id: thread.id,
    artifactId: thread.artifactId,
    revisionId: thread.revisionId,
    status: thread.status,
    title: thread.title,
    anchor: thread.anchor,
    requestedChange: thread.requestedChange,
  });

  const firstComment = thread.comments[0];
  if (firstComment) {
    await db.insert(reviewComments).values({
      id: firstComment.id,
      threadId: thread.id,
      body: firstComment.body,
      author: firstComment.author,
      createdAt: firstComment.createdAt,
      role: firstComment.role,
    });
  }

  return thread;
}

export async function createReviewComment(
  input: CreateReviewCommentInput,
): Promise<ReviewComment> {
  const comment: ReviewComment = {
    id: `comment-${randomUUID()}`,
    body: input.body.trim(),
    author: createActorFromName(input.authorName, input.role ?? 'human'),
    createdAt: new Date().toISOString(),
    role: input.role ?? 'human',
  };

  if (!isDatabaseConfigured()) {
    const thread =
      runtimeThreads.find((candidate) => candidate.id === input.threadId) ??
      getMockArtifacts()
        .flatMap((artifact) => getMockReviewThreads(artifact.id))
        .find((candidate) => candidate.id === input.threadId);
    thread?.comments.push(comment);
    return comment;
  }

  const db = getDb();
  await db.insert(reviewComments).values({
    id: comment.id,
    threadId: input.threadId,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    role: comment.role,
  });

  return comment;
}

export async function updateReviewThreadStatus(
  input: UpdateReviewThreadStatusInput,
): Promise<ReviewThread | undefined> {
  if (!isDatabaseConfigured()) {
    const thread =
      runtimeThreads.find((candidate) => candidate.id === input.threadId) ??
      getMockArtifacts()
        .flatMap((artifact) => getMockReviewThreads(artifact.id))
        .find((candidate) => candidate.id === input.threadId);

    if (thread) {
      thread.status = input.status;
    }

    return thread;
  }

  const db = getDb();
  await db
    .update(reviewThreads)
    .set({ status: input.status })
    .where(eq(reviewThreads.id, input.threadId));

  const threadRows = await db
    .select()
    .from(reviewThreads)
    .where(eq(reviewThreads.id, input.threadId))
    .limit(1);
  const thread = threadRows[0];

  if (!thread) {
    return undefined;
  }

  const commentRows = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.threadId, input.threadId));

  return mapThreadRows([thread], commentRows)[0];
}

export async function createArtifactRevision(
  input: SubmitRevisionInput,
): Promise<ArtifactRevision | undefined> {
  const artifact = await findArtifact(input.artifactId, {
    viewerUserId: input.actorUserId,
  });

  if (!artifact) {
    return undefined;
  }

  const revision: ArtifactRevision = {
    id: `revision-${randomUUID()}`,
    version:
      artifact.revisions.reduce(
        (highestVersion, current) => Math.max(highestVersion, current.version),
        0,
      ) + 1,
    summary: input.summary.trim(),
    html: input.html,
    createdAt: new Date().toISOString(),
    author: createActorFromName(
      input.authorName,
      input.source === 'web' ? 'human' : 'agent',
    ),
    changeRequestIds: input.resolvedThreadIds ?? [],
  };

  if (!isDatabaseConfigured()) {
    artifact.revisions.push(revision);
    artifact.currentRevisionId = revision.id;

    for (const thread of runtimeThreads) {
      if (input.resolvedThreadIds?.includes(thread.id)) {
        thread.status = 'resolved';
      }
    }

    for (const thread of getMockReviewThreads(artifact.id)) {
      if (input.resolvedThreadIds?.includes(thread.id)) {
        thread.status = 'resolved';
      }
    }

    return revision;
  }

  const db = getDb();
  const storedRevision = await storeRevisionHtml({
    artifactId: artifact.id,
    revisionId: revision.id,
    html: revision.html,
  });

  revision.htmlObjectKey = storedRevision.htmlObjectKey;
  await db.insert(artifactRevisions).values({
    id: revision.id,
    artifactId: artifact.id,
    version: revision.version,
    summary: revision.summary,
    html: storedRevision.html,
    htmlObjectKey: storedRevision.htmlObjectKey,
    createdAt: revision.createdAt,
    author: revision.author,
    changeRequestIds: revision.changeRequestIds,
  });
  await db
    .update(artifacts)
    .set({ currentRevisionId: revision.id })
    .where(eq(artifacts.id, artifact.id));

  if (input.resolvedThreadIds?.length) {
    for (const threadId of input.resolvedThreadIds) {
      await db
        .update(reviewThreads)
        .set({ status: 'resolved' })
        .where(eq(reviewThreads.id, threadId));
    }
  }

  return revision;
}

export async function findReviewThread(
  threadId: string,
): Promise<ReviewThread | undefined> {
  const runtimeThread = runtimeThreads.find((thread) => thread.id === threadId);

  if (runtimeThread) {
    return runtimeThread;
  }

  if (!isDatabaseConfigured()) {
    return getMockArtifacts()
      .flatMap((artifact) => getMockReviewThreads(artifact.id))
      .find((thread) => thread.id === threadId);
  }

  const db = getDb();
  const threadRows = await db
    .select()
    .from(reviewThreads)
    .where(eq(reviewThreads.id, threadId))
    .limit(1);
  const thread = threadRows[0];

  if (!thread) {
    return undefined;
  }

  const commentRows = await db
    .select()
    .from(reviewComments)
    .where(eq(reviewComments.threadId, threadId));

  return mapThreadRows([thread], commentRows)[0];
}

export async function getAgentFeedbackBundle(
  artifactId: string,
  revisionId: string,
): Promise<AgentFeedbackBundle> {
  if (!isDatabaseConfigured()) {
    return getMockAgentFeedbackBundle(artifactId, revisionId);
  }

  const openThreads = (await listReviewThreads(artifactId)).filter(
    (thread) =>
      thread.revisionId === revisionId && thread.status !== 'resolved',
  );

  return {
    artifactId,
    revisionId,
    openThreads: openThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      requestedChange: thread.requestedChange,
      comments: thread.comments.map((comment) => comment.body),
      anchor: thread.anchor,
    })),
  };
}
