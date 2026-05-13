import { NextResponse } from 'next/server';
import { updateReviewThreadStatus } from '@docscn/db';
import type {
  ReviewThreadStatus,
  UpdateReviewThreadStatusInput,
} from '@docscn/sdk';

function isReviewThreadStatus(value: unknown): value is ReviewThreadStatus {
  return value === 'open' || value === 'needs-revision' || value === 'resolved';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || !isReviewThreadStatus(body.status)) {
    return NextResponse.json(
      { error: 'Invalid review thread status payload.' },
      { status: 400 },
    );
  }

  const input: UpdateReviewThreadStatusInput = {
    threadId,
    status: body.status,
  };
  const thread = await updateReviewThreadStatus(input);

  if (!thread) {
    return NextResponse.json(
      { error: 'Review thread not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ thread });
}
