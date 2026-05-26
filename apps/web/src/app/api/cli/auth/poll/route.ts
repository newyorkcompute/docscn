import { NextResponse } from 'next/server';
import { pollCliLoginRequest } from '@docscn/db';
import { getClientIp, hitRateLimit } from '../../../../../lib/rate-limit';

const cliPollLimit = 60;
const cliPollWindowMs = 10 * 60 * 1000;

function isDeviceCode(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  if (
    hitRateLimit(
      `cli-poll:${getClientIp(request)}`,
      cliPollLimit,
      cliPollWindowMs,
    )
  ) {
    return NextResponse.json(
      { error: 'CLI login poll rate limit reached. Try again later.' },
      { status: 429 },
    );
  }

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
