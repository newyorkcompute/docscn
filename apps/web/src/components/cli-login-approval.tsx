'use client';

import { useState } from 'react';
import { Button, Card } from '@docscn/ui';

interface CliLoginApprovalProps {
  userCode: string;
}

export function CliLoginApproval({ userCode }: CliLoginApprovalProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  async function approve() {
    setError(null);
    setStatus(null);
    setIsApproving(true);

    const response = await fetch('/api/cli/auth/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userCode }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      status?: string;
    } | null;

    setIsApproving(false);

    if (!response.ok || payload?.status !== 'approved') {
      setError(payload?.error ?? 'Could not approve this CLI login.');
      return;
    }

    setStatus('CLI connected. You can return to your agent.');
  }

  return (
    <Card className="mx-auto max-w-xl p-8">
      <p className="text-sm font-medium text-primary">docscn CLI login</p>
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        Approve this local agent
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        This lets the local docscn CLI save an API key on this machine and act
        on your behalf. Only approve this if you started the login from your
        terminal or agent.
      </p>

      <div className="app-code-panel mt-6 rounded-xl p-4 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Login code
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.2em]">
          {userCode}
        </p>
      </div>

      {status ? (
        <p className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {status}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="mt-6 w-full"
        disabled={isApproving || Boolean(status)}
        onClick={approve}
      >
        {isApproving ? 'Approving...' : 'Approve CLI login'}
      </Button>
    </Card>
  );
}
