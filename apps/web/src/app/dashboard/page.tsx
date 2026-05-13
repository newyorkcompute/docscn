import { getArtifacts } from '@docscn/db';
import { DashboardClient } from '../../components/dashboard-client';
import { SiteHeader } from '../../components/site-header';

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <DashboardClient artifacts={getArtifacts()} />
      </main>
    </>
  );
}
