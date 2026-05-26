const defaultCallbackPath = '/dashboard';

/**
 * Allow only same-site relative paths (no scheme, no protocol-relative URLs).
 */
export function sanitizeCallbackUrl(
  value: string | undefined,
  fallback = defaultCallbackPath,
): string {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
