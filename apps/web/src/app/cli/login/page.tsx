import Link from 'next/link';
import { Button, Card, Shell } from '@docscn/ui';
import { CliLoginApproval } from '../../../components/cli-login-approval';
import { SiteHeader } from '../../../components/site-header';
import { getServerSession } from '../../../lib/session';

interface CliLoginPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function CliLoginPage({
  searchParams,
}: CliLoginPageProps) {
  const [{ code }, session] = await Promise.all([
    searchParams,
    getServerSession(),
  ]);
  const userCode = code?.trim().toUpperCase();
  const callbackURL = userCode
    ? `/cli/login?code=${encodeURIComponent(userCode)}`
    : '/cli/login';

  return (
    <>
      <SiteHeader />
      <main>
        <Shell className="py-16">
          {!userCode ? (
            <Card className="mx-auto max-w-xl p-8 text-center">
              <h1 className="text-2xl font-semibold">Missing CLI login code</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Start from your terminal with{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5">
                  docscn login
                </code>{' '}
                to generate a fresh approval link.
              </p>
            </Card>
          ) : session ? (
            <CliLoginApproval userCode={userCode} />
          ) : (
            <Card className="mx-auto max-w-xl p-8 text-center">
              <p className="text-sm font-medium text-primary">
                docscn CLI login
              </p>
              <h1 className="mt-3 text-2xl font-semibold">
                Sign in to approve this agent
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                After you sign in, you can approve code{' '}
                <span className="font-mono text-foreground">{userCode}</span>{' '}
                and the CLI will save a local API key.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link
                    href={`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`}
                  >
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`}
                  >
                    Create account
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </Shell>
      </main>
    </>
  );
}
