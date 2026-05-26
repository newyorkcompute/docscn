import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';
import { sanitizeCallbackUrl } from '../../lib/safe-callback-url';

interface SignInPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackURL } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <AuthForm
          callbackURL={sanitizeCallbackUrl(callbackURL)}
          mode="sign-in"
        />
      </main>
    </>
  );
}
