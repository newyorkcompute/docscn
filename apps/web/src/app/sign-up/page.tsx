import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';

interface SignUpPageProps {
  searchParams: Promise<{ callbackURL?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackURL } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main>
        <AuthForm callbackURL={callbackURL} mode="sign-up" />
      </main>
    </>
  );
}
