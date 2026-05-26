import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';
import { sanitizeCallbackUrl } from '../../lib/safe-callback-url';

interface SignUpPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackURL } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <AuthForm
          callbackURL={sanitizeCallbackUrl(callbackURL)}
          mode="sign-up"
        />
      </main>
    </>
  );
}
