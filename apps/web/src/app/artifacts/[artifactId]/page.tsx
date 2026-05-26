import {
  canMutateArtifact,
  findArtifact,
  getArtifactAccessRole,
  listArtifactShares,
  listReviewThreads,
} from '@docscn/db';
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
      viewerEmail: session?.user.email,
    })) ?? (await findGalleryArtifact(artifactId));
  const threads = artifact ? await listReviewThreads(artifact.id) : [];
  const isGalleryArtifact = artifact?.id.startsWith('gallery-') ?? false;
  const isAuthenticated = Boolean(session);
  const accessOptions = {
    includeUnlisted: true,
    viewerUserId: session?.user.id,
    viewerEmail: session?.user.email,
  };
  const [accessRole, shares] =
    artifact && !isGalleryArtifact
      ? await Promise.all([
          getArtifactAccessRole(artifact, accessOptions),
          canMutateArtifact(artifact, session?.user.id)
            ? listArtifactShares(artifact.id)
            : Promise.resolve([]),
        ])
      : [undefined, []];
  const canComment =
    isAuthenticated &&
    Boolean(artifact) &&
    !isGalleryArtifact &&
    Boolean(
      accessRole === 'owner' ||
      accessRole === 'commenter' ||
      (accessRole === 'viewer' && artifact?.metadata.visibility !== 'private'),
    );
  const canRevise = Boolean(
    artifact && canMutateArtifact(artifact, session?.user.id),
  );

  return (
    <main className="app-page">
      <ArtifactWorkspace
        artifact={artifact}
        artifactId={artifactId}
        canComment={canComment}
        canRevise={canRevise}
        accessRole={accessRole}
        shares={shares}
        isAuthenticated={isAuthenticated}
        threads={threads}
      />
    </main>
  );
}
