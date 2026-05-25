'use client';

import {
  type ComponentType,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Check,
  Copy,
  Globe2,
  LockKeyhole,
  MailPlus,
  MoreHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  ArtifactShare,
  ArtifactShareRole,
  ArtifactVisibility,
} from '@docscn/sdk';
import { Badge, Button, cn } from '@docscn/ui';

const visibilityCopy: Record<
  ArtifactVisibility,
  { icon: ComponentType<{ className?: string }>; label: string; text: string }
> = {
  public: {
    icon: Globe2,
    label: 'Public',
    text: 'Anyone can find and open this artifact.',
  },
  unlisted: {
    icon: MoreHorizontal,
    label: 'Anyone with the link',
    text: 'Not listed publicly, but the link works for anyone.',
  },
  private: {
    icon: LockKeyhole,
    label: 'Restricted',
    text: 'Only you and invited people can open it.',
  },
};

function roleLabel(role: ArtifactShareRole) {
  return role === 'commenter' ? 'Commenter' : 'Viewer';
}

export function ShareDialog({
  artifactId,
  artifactTitle,
  initialShares,
  initialVisibility,
  onChanged,
  onClose,
  ownerLabel,
}: {
  artifactId: string;
  artifactTitle: string;
  initialShares: ArtifactShare[];
  initialVisibility: ArtifactVisibility;
  ownerLabel: string;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ArtifactShareRole>('viewer');
  const [shares, setShares] = useState(initialShares);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [pending, setPending] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(
    () =>
      typeof window === 'undefined'
        ? ''
        : `${window.location.origin}${window.location.pathname}`,
    [],
  );

  useEffect(() => setShares(initialShares), [initialShares]);
  useEffect(() => setVisibility(initialVisibility), [initialVisibility]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function readError(response: Response) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    return payload?.error ?? `Request failed with ${response.status}.`;
  }

  async function addShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    setPending('add');
    setError(undefined);

    try {
      const response = await fetch(`/api/artifacts/${artifactId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, role }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const payload = (await response.json()) as { share: ArtifactShare };
      setShares((current) => [
        payload.share,
        ...current.filter((share) => share.email !== payload.share.email),
      ]);
      setEmail('');
      setRole('viewer');
      onChanged();
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : 'Could not share.',
      );
    } finally {
      setPending(undefined);
    }
  }

  async function removeShare(emailToRemove: string) {
    setPending(`remove-${emailToRemove}`);
    setError(undefined);

    try {
      const response = await fetch(`/api/artifacts/${artifactId}/shares`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToRemove }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setShares((current) =>
        current.filter((share) => share.email !== emailToRemove),
      );
      onChanged();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Could not remove access.',
      );
    } finally {
      setPending(undefined);
    }
  }

  async function updateVisibility(nextVisibility: ArtifactVisibility) {
    if (nextVisibility === visibility) {
      return;
    }

    setPending(`visibility-${nextVisibility}`);
    setError(undefined);

    try {
      const response = await fetch(`/api/artifacts/${artifactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: nextVisibility }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setVisibility(nextVisibility);
      onChanged();
    } catch (visibilityError) {
      setError(
        visibilityError instanceof Error
          ? visibilityError.message
          : 'Could not update visibility.',
      );
    } finally {
      setPending(undefined);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      aria-labelledby="share-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="w-full max-w-[560px] overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl shadow-black/25">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-muted-foreground">
              Sharing
            </p>
            <h2
              className="mt-1 font-display text-2xl font-semibold tracking-tight"
              id="share-dialog-title"
            >
              Share "{artifactTitle}"
            </h2>
          </div>
          <Button
            aria-label="Close sharing dialog"
            className="h-9 w-9 rounded-full px-0"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={addShare}>
            <label className="sr-only" htmlFor="share-email">
              Email address
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-background px-3">
              <MailPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                id="share-email"
                placeholder="Add people by email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </div>
            <label className="sr-only" htmlFor="share-role">
              Permission
            </label>
            <select
              className="h-11 rounded-2xl border border-border bg-background px-3 text-sm outline-none"
              id="share-role"
              value={role}
              onChange={(event) =>
                setRole(event.currentTarget.value as ArtifactShareRole)
              }
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
            </select>
            <Button disabled={pending === 'add'} type="submit">
              Add
            </Button>
          </form>

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              People with access
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
              <div className="flex items-center justify-between gap-3 bg-secondary/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ownerLabel}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
                <Badge tone="outline">Owner</Badge>
              </div>
              {shares.length ? (
                shares.map((share) => (
                  <div
                    className="flex items-center justify-between gap-3 px-4 py-3"
                    key={share.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {share.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabel(share.role)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={share.role === 'commenter' ? 'default' : 'muted'}
                      >
                        {roleLabel(share.role)}
                      </Badge>
                      <Button
                        aria-label={`Remove access for ${share.email}`}
                        className="h-8 w-8 rounded-full px-0"
                        disabled={pending === `remove-${share.email}`}
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => removeShare(share.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-muted-foreground">
                  No one else has been invited yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-medium">General access</div>
            <div className="grid gap-2">
              {(['private', 'unlisted', 'public'] as const).map((option) => {
                const item = visibilityCopy[option];
                const Icon = item.icon;
                const isSelected = visibility === option;

                return (
                  <button
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-secondary/50',
                    )}
                    disabled={pending === `visibility-${option}`}
                    key={option}
                    type="button"
                    onClick={() => updateVisibility(option)}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="block text-xs leading-5 text-muted-foreground">
                        {item.text}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </section>
    </div>
  );
}
