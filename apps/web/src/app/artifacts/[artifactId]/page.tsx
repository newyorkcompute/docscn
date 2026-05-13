import { getArtifactById, getReviewThreads } from '@docscn/db';
import { ArtifactWorkspace } from '../../../components/artifact-workspace';
import { SiteHeader } from '../../../components/site-header';

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactId: string }>;
}) {
  const { artifactId } = await params;
  const artifact = getArtifactById(artifactId);
  const threads = artifact ? getReviewThreads(artifact.id) : [];

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
