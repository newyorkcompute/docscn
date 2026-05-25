import { listArtifacts } from '@docscn/db';
import { exampleArtifacts } from '../../lib/example-artifacts';
import { getServerSession } from '../../lib/session';
import { getRequestOrigin } from '../../lib/request-origin';
import { DashboardClient } from '../../components/dashboard-client';
import { SiteHeader } from '../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession();
  const origin = await getRequestOrigin();

  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <DashboardClient
          artifacts={await listArtifacts({
            viewerUserId: session?.user.id,
            viewerEmail: session?.user.email,
          })}
          examples={exampleArtifacts}
          isAuthenticated={Boolean(session)}
          origin={origin}
        />
      </main>
    </>
  );
}
