'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Shell } from '@docscn/ui';
import { authClient } from '../lib/auth-client';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSignUp = mode === 'sign-up';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const callbacks = {
      onSuccess: () => {
        router.push('/dashboard');
        router.refresh();
      },
      onError: (ctx: { error: { message?: string } }) => {
        setError(ctx.error.message ?? 'Authentication failed.');
      },
    };

    try {
      if (isSignUp) {
        await authClient.signUp.email(
          {
            email,
            password,
            name,
            callbackURL: '/dashboard',
          },
          callbacks,
        );
      } else {
        await authClient.signIn.email(
          {
            email,
            password,
            callbackURL: '/dashboard',
          },
          callbacks,
        );
      }
    } catch {
      setError('Authentication failed.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Shell className="py-16">
      <Card className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-semibold">
          {isSignUp ? 'Create your docscn account' : 'Sign in to docscn'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use email/password locally. OAuth and orgs can layer in later without
          changing artifact ownership.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          {isSignUp ? (
            <label className="grid gap-2 text-sm">
              Name
              <input
                className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-primary/30 focus:ring-2"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm">
            Email
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-primary/30 focus:ring-2"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Password
            <input
              className="rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-primary/30 focus:ring-2"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button disabled={isPending} type="submit">
            {isPending ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : 'New to docscn?'}{' '}
          <Link
            className="text-primary hover:underline"
            href={isSignUp ? '/sign-in' : '/sign-up'}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </Link>
        </p>
      </Card>
    </Shell>
  );
}
