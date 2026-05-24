import type { AnonymousClaimReceipt } from '@docscn/sdk';

const storageKey = 'docscn.anonymousClaims.v1';

function readAllReceipts() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(parsed) ? (parsed as AnonymousClaimReceipt[]) : [];
  } catch {
    return [];
  }
}

function writeAllReceipts(receipts: AnonymousClaimReceipt[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(receipts));
}

export function saveAnonymousClaimReceipt(receipt: AnonymousClaimReceipt) {
  const receipts = readAllReceipts().filter(
    (existing) => existing.artifactId !== receipt.artifactId,
  );

  receipts.push(receipt);
  writeAllReceipts(receipts);
}

export function getAnonymousClaimReceipts() {
  return readAllReceipts();
}

export function removeAnonymousClaimReceipts(artifactIds: string[]) {
  const claimed = new Set(artifactIds);
  const remaining = readAllReceipts().filter(
    (receipt) => !claimed.has(receipt.artifactId),
  );

  writeAllReceipts(remaining);
}
