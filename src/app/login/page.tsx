import { redirect } from 'next/navigation';
import getServerSession from '../../lib/session';
import SignInClient from './SignInClient';

export default async function LoginPage() {
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign in</h1>
      <p>Sign in to access your workspace and documents.</p>
      <SignInClient />
    </main>
  );
}
