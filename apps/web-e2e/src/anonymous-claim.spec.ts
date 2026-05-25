import { expect, test } from '@playwright/test';
import {
  claimStorageKey,
  newContext,
  publishArtifact,
  signUp,
  uniqueEmail,
  uniqueTitle,
} from './helpers';

test('recovers an anonymous artifact after sign-up', async ({ browser }) => {
  const context = await newContext(browser);
  const page = await context.newPage();
  const title = uniqueTitle('Playwright anonymous claim');

  const published = await publishArtifact(context.request, {
    title,
    visibility: 'private',
  });

  expect(published.artifact.metadata.visibility).toBe('unlisted');
  expect(published.result.claimToken).toBeTruthy();

  await page.goto('/');
  await page.evaluate(
    ({ artifactId, claimToken, slug, title: receiptTitle, storageKey }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify([
          {
            artifactId,
            claimToken,
            slug,
            title: receiptTitle,
            createdAt: new Date().toISOString(),
          },
        ]),
      );
    },
    {
      artifactId: published.result.artifactId,
      claimToken: published.result.claimToken,
      slug: published.result.slug,
      title,
      storageKey: claimStorageKey,
    },
  );

  await signUp(context.request, {
    email: uniqueEmail('playwright-claim'),
    name: 'Playwright Claim User',
  });

  await page.goto('/dashboard');

  await expect(page.getByText('Recovered 1 anonymous artifact.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        claimStorageKey,
      ),
    )
    .toBe('[]');

  await context.close();
});
