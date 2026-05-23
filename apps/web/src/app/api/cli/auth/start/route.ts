import { NextResponse } from 'next/server';
import { createCliLoginRequest, isDatabaseConfigured } from '@docscn/db';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'CLI login requires DATABASE_URL. Run npm run setup:local, then restart the app with npm run dev:persistent.',
      },
      { status: 503 },
    );
  }

  const loginRequest = await createCliLoginRequest();
  const verificationUrl = new URL('/cli/login', request.url);
  verificationUrl.searchParams.set('code', loginRequest.userCode);

  return NextResponse.json({
    ...loginRequest,
    verificationUrl: verificationUrl.toString(),
  });
}
