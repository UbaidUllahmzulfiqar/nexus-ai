'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignInClient() {
  return (
    <div style={{ display: 'flex', gap: 12, flexDirection: 'column', maxWidth: 420 }}>
      <button onClick={() => signIn('github')} style={{ padding: '8px 12px', borderRadius: 6 }}>
        Continue with GitHub
      </button>

      <a href="/api/auth/demo-login" style={{ color: '#06c' }}>
        Dev: Sign in with demo token
      </a>

      <Link href="/signup">Create an account</Link>
    </div>
  );
}
