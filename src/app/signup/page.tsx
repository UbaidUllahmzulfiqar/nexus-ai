import { redirect } from 'next/navigation';
import getServerSession from '../../lib/session';
import SignInClient from '../login/SignInClient';

export default async function SignupPage() {
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <main style={{ padding: 24 }}>
      <h1>Create account</h1>
      <p>Create or sign in with your GitHub account.</p>
      <SignInClient />
    </main>
  );
}
