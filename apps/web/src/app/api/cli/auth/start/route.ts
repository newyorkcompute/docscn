import { NextResponse } from 'next/server';
import { createCliLoginRequest } from '@docscn/db';

export async function POST(request: Request) {
  const loginRequest = await createCliLoginRequest();
  const verificationUrl = new URL('/cli/login', request.url);
  verificationUrl.searchParams.set('code', loginRequest.userCode);

  return NextResponse.json({
    ...loginRequest,
    verificationUrl: verificationUrl.toString(),
  });
}
