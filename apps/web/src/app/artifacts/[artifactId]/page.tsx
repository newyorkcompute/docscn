import { findArtifact, listReviewThreads } from '@docscn/db';
import { ArtifactWorkspace } from '../../../components/artifact-workspace';
import { SiteHeader } from '../../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactId: string }>;
}) {
  const { artifactId } = await params;
  const artifact = await findArtifact(artifactId);
  const threads = artifact ? await listReviewThreads(artifact.id) : [];

  return (
    <>
      <SiteHeader />
      <main>
        <ArtifactWorkspace
          artifact={artifact}
          artifactId={artifactId}
          threads={threads}
        />
      </main>
    </>
  );
}
