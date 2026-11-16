'use server';

import { auth, dbInstance } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { isAllowedAvatarImageUrl, isPresetAvatar } from '@/lib/avatars';

/**
 * Update the signed-in user's avatar. Accepts either a preset icon or an
 * UploadThing-hosted image URL (from the `avatarUploader` route).
 */
export async function updateCurrentUserAvatarAction(avatar: string): Promise<{
  success: boolean;
  avatar?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: 'You must be signed in to change your avatar.' };
    }

    const value = (avatar || '').trim();
    if (!isPresetAvatar(value) && !isAllowedAvatarImageUrl(value)) {
      return { success: false, error: 'Please pick one of the icons or upload an image.' };
    }

    const userId = session.user.id;

    if (dbInstance instanceof Pool) {
      await dbInstance.query('UPDATE "user" SET image = $1, "updatedAt" = NOW() WHERE id = $2', [value, userId]);
      // Keep the author avatar shown on this user's published games in sync
      await dbInstance
        .query('UPDATE games SET author_avatar = $1 WHERE author_id = $2', [value, userId])
        .catch((err) => console.warn('Could not sync game author avatars:', err?.message || err));
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance.prepare('UPDATE user SET image = ? WHERE id = ?').run(value, userId);
      try {
        dbInstance.prepare('UPDATE games SET author_avatar = ? WHERE author_id = ?').run(value, userId);
      } catch (err) {
        console.warn('Could not sync game author avatars:', err instanceof Error ? err.message : err);
      }
    }

    return { success: true, avatar: value };
  } catch (err: unknown) {
    console.error('Failed to update avatar:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not update avatar. Please try again.',
    };
  }
}

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

