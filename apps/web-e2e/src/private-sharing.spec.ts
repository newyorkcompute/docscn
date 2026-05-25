import { expect, test } from '@playwright/test';
import {
  newContext,
  publishArtifact,
  removeArtifactShare,
  shareArtifact,
  signUp,
  uniqueEmail,
  uniqueTitle,
} from './helpers';

test('enforces private sharing roles through the workspace UI', async ({
  browser,
}) => {
  const ownerContext = await newContext(browser);
  const invitedContext = await newContext(browser);
  const ownerEmail = uniqueEmail('playwright-owner');
  const invitedEmail = uniqueEmail('playwright-invited');
  const title = uniqueTitle('Playwright private share');

  await signUp(ownerContext.request, {
    email: ownerEmail,
    name: 'Playwright Owner',
  });
  await signUp(invitedContext.request, {
    email: invitedEmail,
    name: 'Playwright Invited',
  });

  const published = await publishArtifact(ownerContext.request, {
    title,
    visibility: 'private',
  });

  const artifactPath = `/artifacts/${published.result.slug}`;
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto(artifactPath);

  await expect(
    ownerPage.frameLocator('iframe').getByRole('heading', { name: title }),
  ).toBeVisible();
  await ownerPage
    .getByRole('button', { name: 'Open sharing settings' })
    .click();

  const dialog = ownerPage.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Email address').fill(invitedEmail);
  await dialog.getByLabel('Permission').selectOption('viewer');
  await dialog.getByRole('button', { name: 'Add' }).click();
  await expect(dialog.getByText(invitedEmail)).toBeVisible();
  await dialog.getByRole('button', { name: 'Done' }).click();

  const invitedPage = await invitedContext.newPage();
  await invitedPage.goto(artifactPath);

  await expect(
    invitedPage.frameLocator('iframe').getByRole('heading', { name: title }),
  ).toBeVisible();
  await expect(
    invitedPage.getByRole('button', { name: 'Open sharing settings' }),
  ).toHaveCount(0);

  await invitedPage.getByLabel(/Open review drawer/).click();
  await expect(
    invitedPage.getByText('You have view-only access.'),
  ).toBeVisible();
  await expect(
    invitedPage.getByText(
      'Ask the owner for commenter access to leave review threads and replies.',
    ),
  ).toBeVisible();

  await shareArtifact(ownerContext.request, {
    artifactIdOrSlug: published.result.slug,
    email: invitedEmail,
    role: 'commenter',
  });

  await invitedPage.reload();
  await invitedPage
    .getByRole('button', { name: 'Place a point comment' })
    .click();
  await invitedPage
    .getByRole('button', { name: 'Place comment on artifact' })
    .click({ position: { x: 320, y: 260 } });
  await invitedPage
    .getByPlaceholder('What should change?')
    .fill('Commenter can leave review threads.');

  const threadResponse = invitedPage.waitForResponse(
    (response) =>
      response.url().includes('/api/artifacts/') &&
      response.url().includes('/threads') &&
      response.request().method() === 'POST',
  );
  await invitedPage.getByRole('button', { name: 'Add' }).click();
  expect((await threadResponse).ok()).toBe(true);

  await invitedPage.getByLabel(/Open review drawer/).click();
  await expect(
    invitedPage.getByText('Commenter can leave review threads.'),
  ).toBeVisible();

  await removeArtifactShare(ownerContext.request, {
    artifactIdOrSlug: published.result.slug,
    email: invitedEmail,
  });

  await invitedPage.goto(artifactPath);
  await expect(
    invitedPage.getByRole('heading', { name: 'No artifact found' }),
  ).toBeVisible();

  await ownerContext.close();
  await invitedContext.close();
});
