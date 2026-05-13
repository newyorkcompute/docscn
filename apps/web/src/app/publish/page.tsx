import { PublishArtifactForm } from '../../components/publish-artifact-form';
import { SiteHeader } from '../../components/site-header';

export default function PublishPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PublishArtifactForm />
      </main>
    </>
  );
}
