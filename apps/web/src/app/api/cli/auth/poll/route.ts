import { NextResponse } from 'next/server';
import { pollCliLoginRequest } from '@docscn/db';

function isDeviceCode(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isDeviceCode(body.deviceCode)) {
    return NextResponse.json(
      { error: 'Missing CLI device code.' },
      { status: 400 },
    );
  }

  const result = await pollCliLoginRequest(body.deviceCode);

  return NextResponse.json(result, {
    status:
      result.status === 'pending' || result.status === 'approved' ? 200 : 400,
  });
}
