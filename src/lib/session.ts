import { getServerSession as nextGetServerSession } from 'next-auth/next';
import type { AuthOptions } from 'next-auth';
import authOptions from './authOptions';

export async function getServerSession() {
  return nextGetServerSession(authOptions as AuthOptions);
}

export default getServerSession;
