'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiKey } from '@docscn/sdk';
import { Badge, Button, Card, Shell } from '@docscn/ui';

interface ApiKeysClientProps {
  apiKeys: ApiKey[];
}

export function ApiKeysClient({ apiKeys }: ApiKeysClientProps) {
  const router = useRouter();
  const [name, setName] = useState('Local CLI');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedToken(null);
    setIsPending(true);

    const response = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json().catch(() => null)) as {
      token?: string;
      error?: string;
    } | null;

    setIsPending(false);

    if (!response.ok) {
      setError(payload?.error ?? 'Failed to create API key.');
      return;
    }

    setCreatedToken(payload?.token ?? null);
    router.refresh();
  }

  async function revokeKey(apiKeyId: string) {
    setError(null);
    const response = await fetch(`/api/api-keys/${apiKeyId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? 'Failed to revoke API key.');
      return;
    }

    router.refresh();
  }

  return (
    <Shell className="py-12">
      <div className="mx-auto grid max-w-4xl gap-6">
        <div>
          <Badge tone="outline">agent access</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            API keys
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create scoped publishing credentials for local CLI experiments,
            Cursor agents, scheduled reports, and future MCP workflows.
          </p>
        </div>

        <Card className="p-6">
          <form
            className="grid gap-4 sm:grid-cols-[1fr_auto]"
            onSubmit={createKey}
          >
            <label className="grid gap-2 text-sm">
              Key name
              <input
                className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-primary/30 focus:ring-2"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
            <div className="flex items-end">
              <Button disabled={isPending} type="submit">
                {isPending ? 'Creating...' : 'Create key'}
              </Button>
            </div>
          </form>

          {createdToken ? (
            <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium text-primary">
                Copy this token now. It will not be shown again.
              </p>
              <code className="mt-3 block overflow-x-auto rounded-md bg-background p-3 text-xs text-foreground">
                {createdToken}
              </code>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </Card>

        <div className="grid gap-3">
          {apiKeys.map((apiKey) => (
            <Card
              className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              key={apiKey.id}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{apiKey.name}</h2>
                  {apiKey.revokedAt ? (
                    <Badge tone="warning">revoked</Badge>
                  ) : (
                    <Badge tone="success">active</Badge>
                  )}
                </div>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {apiKey.keyPrefix}...
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {new Date(apiKey.createdAt).toLocaleString()}
                  {apiKey.lastUsedAt
                    ? ` · Last used ${new Date(apiKey.lastUsedAt).toLocaleString()}`
                    : ''}
                </p>
              </div>
              <Button
                disabled={Boolean(apiKey.revokedAt)}
                onClick={() => revokeKey(apiKey.id)}
                size="sm"
                variant="outline"
              >
                Revoke
              </Button>
            </Card>
          ))}
          {apiKeys.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No API keys yet.
            </Card>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
