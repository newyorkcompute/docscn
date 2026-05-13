import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <AuthForm mode="sign-in" />
      </main>
    </>
  );
}
