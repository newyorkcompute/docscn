import { AuthForm } from '../../components/auth-form';
import { SiteHeader } from '../../components/site-header';

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <AuthForm mode="sign-up" />
      </main>
    </>
  );
}
