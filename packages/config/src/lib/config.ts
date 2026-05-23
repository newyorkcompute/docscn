export const runtimeEnvKeys = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'REDIS_URL',
] as const;

export const docscnPackageBoundaries = {
  web: 'Next.js app surfaces for publishing, viewing, reviewing, and revising artifacts.',
  ui: 'Shared React primitives and docscn-specific interface building blocks.',
  db: 'Domain data access, mock repositories, and future Drizzle schema/migrations.',
  sdk: 'Public contracts for artifacts, publishing APIs, comments, revisions, MCP, and agents.',
  cli: 'docscn automation and local artifact publishing commands.',
} as const;
