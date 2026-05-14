import { NextResponse } from 'next/server';
import { approveCliLoginRequest } from '@docscn/db';
import { getRequestSession } from '../../../../../lib/session';

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
