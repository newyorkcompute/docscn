import { Button, Shell } from '@docscn/ui';
import { AppPageHeader } from '../../components/app-page-header';
import { ExampleGallery } from '../../components/example-gallery';
import { SiteHeader } from '../../components/site-header';
import { exampleArtifacts } from '../../lib/example-artifacts';

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <main className="app-page">
        <Shell className="grid gap-8 py-10">
          <AppPageHeader
            actions={
              <Button asChild>
                <a href="/skills.md">Agent guide</a>
              </Button>
            }
            description="Browse self-contained HTML templates, open them in the review workspace, or point an agent at the repo files and ask it to adapt one."
            eyebrow="template library"
            title="HTML templates"
          />

          <ExampleGallery examples={exampleArtifacts} showHeader={false} />
        </Shell>
      </main>
    </>
  );
}
