import { auth, isRootUser } from '@/lib/auth';
import { headers } from 'next/headers';
import { BuddyLineApp } from '@/components/buddy-line-app';
import type { SessionType } from '@/components/auth-provider';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let session: SessionType = null;
  let isRoot = false;

  try {
    const reqHeaders = await headers();
    const fetchedSession = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (fetchedSession) {
      session = fetchedSession as unknown as SessionType;
      if (fetchedSession.user) {
        isRoot = isRootUser(fetchedSession.user);
      }
    }
  } catch (err) {
    console.error('Failed to fetch server session:', err);
  }

  return (
    <BuddyLineApp
      initialSession={session}
      initialIsRoot={isRoot}
    />
  );
}
