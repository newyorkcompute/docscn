import { listArtifacts } from '@docscn/db';
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
      <main>
        <DashboardClient
          artifacts={await listArtifacts({ viewerUserId: session?.user.id })}
          origin={origin}
        />
      </main>
    </>
  );
}
