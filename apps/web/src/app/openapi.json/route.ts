import { NextResponse } from 'next/server';
import { openApiSpec } from '@docscn/sdk';

type OpenApiDocument = {
  servers?: Array<{ url: string; description?: string }>;
  [key: string]: unknown;
};

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const baseSpec = openApiSpec as OpenApiDocument;
  const spec = {
    ...baseSpec,
    servers: [
      { url: origin, description: 'Current host' },
      ...(baseSpec.servers ?? []),
    ],
  };

  return NextResponse.json(spec, {
    headers: {
      'cache-control': 'public, max-age=3600',
    },
  });
}
