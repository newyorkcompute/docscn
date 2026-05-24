import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function resolveExamplesDir() {
  const candidates = [
    join(process.cwd(), 'examples/artifacts'),
    join(process.cwd(), '../../examples/artifacts'),
  ];

  for (const directory of candidates) {
    if (existsSync(join(directory, 'minimal.html'))) {
      return directory;
    }
  }

  throw new Error('Could not locate examples/artifacts directory.');
}

export async function readExampleArtifactHtml(filename: string) {
  const html = await readFile(
    join(resolveExamplesDir(), filename),
    'utf8',
  );

  if (!html.toLowerCase().includes('<html')) {
    throw new Error(`Example artifact ${filename} must include <html>.`);
  }

  return html;
}
