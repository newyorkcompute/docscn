import { NextResponse } from 'next/server';
import { approveCliLoginRequest } from '@docscn/db';
import { getClientIp, hitRateLimit } from '../../../../../lib/rate-limit';
import { getRequestSession } from '../../../../../lib/session';

const cliApproveLimit = 10;
const cliApproveWindowMs = 10 * 60 * 1000;

function isUserCode(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to approve CLI login.' },
      { status: 401 },
    );
  }

  const clientIp = getClientIp(request);

  if (
    hitRateLimit(
      `cli-approve:ip:${clientIp}`,
      cliApproveLimit,
      cliApproveWindowMs,
    ) ||
    hitRateLimit(
      `cli-approve:user:${session.user.id}`,
      cliApproveLimit,
      cliApproveWindowMs,
    )
  ) {
    return NextResponse.json(
      { error: 'CLI login approval rate limit reached. Try again later.' },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isUserCode(body.userCode)) {
    return NextResponse.json(
      { error: 'Missing CLI login code.' },
      { status: 400 },
    );
  }

  const approval = await approveCliLoginRequest({
    userCode: body.userCode,
    userId: session.user.id,
  });

  return NextResponse.json(approval, {
    status: approval.status === 'approved' ? 200 : 400,
  });
}
