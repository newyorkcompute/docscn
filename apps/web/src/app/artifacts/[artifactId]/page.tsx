import { findArtifact, listReviewThreads } from '@docscn/db';
import { findGalleryArtifact } from '../../../lib/gallery-artifacts.server';
import { getServerSession } from '../../../lib/session';
import { ArtifactWorkspace } from '../../../components/artifact-workspace';

export const dynamic = 'force-dynamic';

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ artifactId: string }>;
}) {
  const { artifactId } = await params;
  const session = await getServerSession();
  const artifact =
    (await findArtifact(artifactId, {
      includeUnlisted: true,
      viewerUserId: session?.user.id,
    })) ?? (await findGalleryArtifact(artifactId));
  const threads = artifact ? await listReviewThreads(artifact.id) : [];

  return (
    <main>
      <ArtifactWorkspace
        artifact={artifact}
        artifactId={artifactId}
        threads={threads}
      />
    </main>
  );
}
