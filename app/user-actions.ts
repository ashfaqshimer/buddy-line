'use server';

import { auth, dbInstance } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';

export async function updateCurrentUserEmailAction(newEmail: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: 'You must be signed in to update your email.' };
    }

    const trimmed = (newEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      return { success: false, error: 'Please enter a valid email address (e.g. user@example.com).' };
    }

    // Check if another account already uses this email
    if (dbInstance instanceof Pool) {
      const existing = await dbInstance.query(
        'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) AND id != $2',
        [trimmed, session.user.id]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        return { success: false, error: 'This email is already associated with another account.' };
      }

      await dbInstance.query('UPDATE "user" SET email = $1 WHERE id = $2', [trimmed, session.user.id]);
    } else if (dbInstance instanceof DatabaseSync) {
      const existing = dbInstance
        .prepare('SELECT id FROM user WHERE LOWER(email) = LOWER(?) AND id != ?')
        .get(trimmed, session.user.id);
      if (existing) {
        return { success: false, error: 'This email is already associated with another account.' };
      }

      dbInstance.prepare('UPDATE user SET email = ? WHERE id = ?').run(trimmed, session.user.id);
    }

    return { success: true, email: trimmed };
  } catch (err: unknown) {
    console.error('Failed to update email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not update email. Please try again.',
    };
  }
}
