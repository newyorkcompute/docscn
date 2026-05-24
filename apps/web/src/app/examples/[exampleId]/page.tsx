import { notFound } from 'next/navigation';
import {
  getExampleArtifact,
  getExamplePublishCommand,
} from '../../../lib/example-artifacts';
import { readExampleArtifactHtml } from '../../../lib/example-artifacts.server';
import { getRequestOrigin } from '../../../lib/request-origin';
import { ExamplePreviewClient } from '../../../components/example-preview-client';
import { SiteHeader } from '../../../components/site-header';

export const dynamic = 'force-dynamic';

export default async function ExamplePreviewPage({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}) {
  const { exampleId } = await params;
  const example = getExampleArtifact(exampleId);

  if (!example) {
    notFound();
  }

  const [html, origin] = await Promise.all([
    readExampleArtifactHtml(example.filename),
    getRequestOrigin(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <ExamplePreviewClient
          filename={example.filename}
          html={html}
          kind={example.kind}
          publishCommand={getExamplePublishCommand(origin, example.filename)}
          title={example.title}
        />
      </main>
    </>
  );
}
