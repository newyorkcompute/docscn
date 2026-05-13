import { listArtifacts } from '@docscn/db';
import { DashboardClient } from '../../components/dashboard-client';
import { SiteHeader } from '../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <DashboardClient artifacts={await listArtifacts()} />
      </main>
    </>
  );
}
