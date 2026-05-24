import Link from 'next/link';
import { exampleArtifacts } from '../../lib/example-artifacts';
import { getRequestOrigin } from '../../lib/request-origin';
import { ExampleGallery } from '../../components/example-gallery';
import { SiteHeader } from '../../components/site-header';
import { Button, Eyebrow, Shell } from '@docscn/ui';

export const dynamic = 'force-dynamic';

export default async function ExamplesPage() {
  const origin = await getRequestOrigin();

  return (
    <>
      <SiteHeader />
      <main>
        <Shell className="space-y-8 py-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Eyebrow>starter gallery</Eyebrow>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Example artifacts for publish and review demos.
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Each file is self-contained HTML you can preview here, publish
                with the CLI, and use to exercise comment pins and revision
                feedback.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>

          <ExampleGallery examples={exampleArtifacts} origin={origin} />
        </Shell>
      </main>
    </>
  );
}
