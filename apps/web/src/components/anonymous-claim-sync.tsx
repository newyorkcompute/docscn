'use client';

import { useEffect, useState } from 'react';
import type { ClaimArtifactsResult } from '@docscn/sdk';
import { Card } from '@docscn/ui';
import {
  getAnonymousClaimReceipts,
  removeAnonymousClaimReceipts,
} from '../lib/anonymous-claim-receipts';

export function AnonymousClaimSync({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const receipts = getAnonymousClaimReceipts();
    if (!receipts.length) {
      return;
    }

    let cancelled = false;

    async function claimReceipts() {
      try {
        const response = await fetch('/api/artifacts/claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receipts }),
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as ClaimArtifactsResult;
        const completedIds = [
          ...result.claimed.map((artifact) => artifact.artifactId),
          ...result.skipped.map((artifact) => artifact.artifactId),
        ];
        removeAnonymousClaimReceipts(completedIds);

        if (!cancelled && result.claimed.length) {
          setMessage(
            `Recovered ${result.claimed.length} anonymous artifact${
              result.claimed.length === 1 ? '' : 's'
            }.`,
          );
        }
      } catch {
        // Recovery is opportunistic; keep receipts for the next signed-in visit.
      }
    }

    void claimReceipts();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!message) {
    return null;
  }

  return (
    <Card className="border-primary/25 bg-primary/10 p-4 text-sm text-primary">
      {message}
    </Card>
  );
}
