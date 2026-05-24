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

        if (!cancelled) {
          const expiredCount = result.skipped.filter(
            (artifact) => artifact.reason === 'expired-token',
          ).length;

          const messages: string[] = [];

          if (result.claimed.length) {
            messages.push(
              `Recovered ${result.claimed.length} anonymous artifact${
                result.claimed.length === 1 ? '' : 's'
              }.`,
            );
          }

          if (expiredCount) {
            messages.push(
              `${expiredCount} anonymous artifact recovery receipt${
                expiredCount === 1 ? ' has' : 's have'
              } expired. The unlisted link still works, but ownership can no longer be recovered.`,
            );
          }

          if (messages.length) {
            setMessage(messages.join(' '));
          }
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
