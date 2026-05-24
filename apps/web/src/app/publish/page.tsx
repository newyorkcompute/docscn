import { getServerSession } from '../../lib/session';
import { PublishArtifactForm } from '../../components/publish-artifact-form';
import { SiteHeader } from '../../components/site-header';

export default async function PublishPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main>
        <PublishArtifactForm isAuthenticated={Boolean(session)} />
      </main>
    </>
  );
}
