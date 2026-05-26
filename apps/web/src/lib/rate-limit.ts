/**
 * In-memory sliding-window rate limits for API routes.
 *
 * Trust boundary: use the rightmost X-Forwarded-For hop (nearest the app).
 * Operators should strip or overwrite client-supplied X-Forwarded-For at the edge.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean);

    if (hops.length > 0) {
      return hops[hops.length - 1] ?? 'unknown';
    }
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (bucket.count >= limit) {
    return true;
  }

  bucket.count += 1;
  return false;
}
