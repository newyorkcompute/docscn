import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';

interface SignInPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackURL } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <AuthForm callbackURL={callbackURL} mode="sign-in" />
      </main>
    </>
  );
}
