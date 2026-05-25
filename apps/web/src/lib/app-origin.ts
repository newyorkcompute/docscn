export function getAppOrigin() {
  return (
    process.env['BETTER_AUTH_URL'] ??
    process.env['NEXT_PUBLIC_APP_URL'] ??
    'http://localhost:3000'
  );
}
