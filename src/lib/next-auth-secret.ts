export function getNextAuthSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.APP_JWT_SECRET ?? 'dev-secret';
}
