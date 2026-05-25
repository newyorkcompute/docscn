import { expect, type APIRequestContext, type Browser } from '@playwright/test';

export const baseURL = process.env.DOCSCN_TEST_URL ?? 'http://localhost:3000';
export const claimStorageKey = 'docscn.anonymousClaims.v1';

const password = 'docscn-playwright-password';

interface PublishedArtifactResponse {
  artifact: {
    id: string;
    slug: string;
    metadata: {
      title: string;
      visibility: 'public' | 'unlisted' | 'private';
    };
  };
  result: {
    artifactId: string;
    slug: string;
    url: string;
    revisionId: string;
    claimToken?: string;
  };
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@docscn.local`;
}

export function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
}

export async function newContext(browser: Browser) {
  return browser.newContext({ baseURL });
}

export async function signUp(
  request: APIRequestContext,
  {
    email,
    name,
  }: {
    email: string;
    name: string;
  },
) {
  const response = await request.post('/api/auth/sign-up/email', {
    headers: {
      origin: baseURL,
    },
    data: {
      email,
      name,
      password,
    },
  });

  await expect(response).toBeOK();
}

export async function publishArtifact(
  request: APIRequestContext,
  {
    title,
    visibility = 'unlisted',
  }: {
    title: string;
    visibility?: 'public' | 'unlisted' | 'private';
  },
) {
  const response = await request.post('/api/artifacts', {
    data: {
      title,
      description: `${title} description`,
      html: `<!doctype html><html><body><main><h1>${title}</h1><p>Playwright artifact body.</p></main></body></html>`,
      visibility,
      authorName: 'Playwright',
      source: 'automation',
      kind: 'custom-html',
    },
  });

  await expect(response).toBeOK();
  return (await response.json()) as PublishedArtifactResponse;
}

export async function shareArtifact(
  request: APIRequestContext,
  {
    artifactIdOrSlug,
    email,
    role,
  }: {
    artifactIdOrSlug: string;
    email: string;
    role: 'viewer' | 'commenter';
  },
) {
  const response = await request.post(
    `/api/artifacts/${encodeURIComponent(artifactIdOrSlug)}/shares`,
    {
      data: { email, role },
    },
  );

  await expect(response).toBeOK();
}

export async function removeArtifactShare(
  request: APIRequestContext,
  {
    artifactIdOrSlug,
    email,
  }: {
    artifactIdOrSlug: string;
    email: string;
  },
) {
  const response = await request.delete(
    `/api/artifacts/${encodeURIComponent(artifactIdOrSlug)}/shares`,
    {
      data: { email },
    },
  );

  await expect(response).toBeOK();
}
