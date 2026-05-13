import Link from 'next/link';
import { Button, Card, Shell } from '@docscn/ui';
import { getServerSession } from '../../lib/session';
import { PublishArtifactForm } from '../../components/publish-artifact-form';
import { SiteHeader } from '../../components/site-header';

export default async function PublishPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main>
        {session ? (
          <PublishArtifactForm />
        ) : (
          <Shell className="py-16">
            <Card className="mx-auto max-w-xl p-8 text-center">
              <h1 className="text-2xl font-semibold">Sign in to publish</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Publishing now attaches artifacts to an owner so private drafts
                and revision actions have a real security model.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/sign-up">Create account</Link>
                </Button>
              </div>
            </Card>
          </Shell>
        )}
      </main>
    </>
  );
}
