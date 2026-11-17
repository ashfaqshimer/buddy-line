'use server';

import { auth, dbInstance, isRootUser, ensureAuthMigrations } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { randomInt } from 'node:crypto';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  createdAt: string;
  isRoot: boolean;
}

export async function checkIsRootUserAction(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return false;
    
    const user = session.user as { id?: string; email?: string; username?: string; role?: string };
    if (isRootUser(user)) return true;

    // Check DB in case username or role was not fully hydrated in session cookie
    if (user.id && (!user.username || !user.role)) {
      if (dbInstance instanceof Pool) {
        const res = await dbInstance.query('SELECT email, username, role FROM "user" WHERE id = $1', [user.id]);
        if (res.rows[0] && isRootUser(res.rows[0])) return true;
      } else if (dbInstance instanceof DatabaseSync) {
        const row = dbInstance.prepare('SELECT email, username, role FROM user WHERE id = ?').get(user.id) as { email: string; username: string | null; role: string | null } | undefined;
        if (row && isRootUser(row)) return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Failed to check root user status:', err);
    return false;
  }
}

export async function getUsersListAction(): Promise<{
  success: boolean;
  users?: UserSummary[];
  viewer?: { id: string; isRoot: boolean };
  error?: string;
}> {
  try {
    await ensureAuthMigrations();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: 'Authentication required.' };
    }

    const isCallerRoot = isRootUser(session.user as { email?: string; username?: string });
    const callerRole = (session.user as { role?: string }).role;

    if (!isCallerRoot && callerRole !== 'admin') {
      return {
        success: false,
        error: 'Access restricted: Only Root or Admins can access user management.',
      };
    }

    let rows: Array<{
      id: string;
      name: string;
      email: string;
      username: string | null;
      role: string | null;
      createdAt: Date | string;
    }> = [];

    if (dbInstance instanceof Pool) {
      const res = await dbInstance.query(
        'SELECT id, name, email, username, role, "createdAt" FROM "user" ORDER BY "createdAt" DESC'
      );
      rows = res.rows;
    } else if (dbInstance instanceof DatabaseSync) {
      rows = dbInstance
        .prepare('SELECT id, name, email, username, role, createdAt FROM user ORDER BY createdAt DESC')
        .all() as typeof rows;
    }

    const users: UserSummary[] = rows.map((u) => {
      const isTargetRoot = isRootUser({ email: u.email, username: u.username });
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: isTargetRoot ? 'root' : u.role || 'user',
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        isRoot: isTargetRoot,
      };
    });

    return { success: true, users, viewer: { id: session.user.id, isRoot: isCallerRoot } };
  } catch (err: unknown) {
    console.error('Failed to list users:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve users.',
    };
  }
}

export async function setUserRoleAction(payload: {
  targetUserId: string;
  newRole: 'admin' | 'user';
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAuthMigrations();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: 'Authentication required.' };
    }

    // Only the ROOT user is authorized to grant or revoke admin roles!
    const isCallerRoot = isRootUser(session.user as { email?: string; username?: string });
    if (!isCallerRoot) {
      return {
        success: false,
        error: 'Unauthorized: Only the Root User can assign or revoke Admin roles.',
      };
    }

    const { targetUserId, newRole } = payload;
    if (!targetUserId || !['admin', 'user'].includes(newRole)) {
      return { success: false, error: 'Invalid user or role specified.' };
    }

    // Retrieve target user to ensure we don't attempt to demote Root
    let targetUser: { email: string; username: string | null } | undefined;
    if (dbInstance instanceof Pool) {
      const res = await dbInstance.query('SELECT email, username FROM "user" WHERE id = $1', [
        targetUserId,
      ]);
      targetUser = res.rows[0];
    } else if (dbInstance instanceof DatabaseSync) {
      targetUser = dbInstance
        .prepare('SELECT email, username FROM user WHERE id = ?')
        .get(targetUserId) as typeof targetUser;
    }

    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    if (isRootUser(targetUser) && newRole !== 'admin') {
      return { success: false, error: 'The Root User cannot be demoted.' };
    }

    // Perform role update
    if (dbInstance instanceof Pool) {
      await dbInstance.query('UPDATE "user" SET role = $1 WHERE id = $2', [newRole, targetUserId]);
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance.prepare('UPDATE user SET role = ? WHERE id = ?').run(newRole, targetUserId);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to update user role:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update user role.',
    };
  }
}


// Unambiguous characters only (no 0/O, 1/I/L) so codes are easy to read aloud.
const RESET_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const RESET_CODE_LENGTH = 8; // ~40 bits of entropy; single use + short expiry
const RESET_CODE_TTL_MS = 30 * 60 * 1000;

type UserRow = { id: string; email: string; username: string | null; role: string | null };

async function findUserRow(userId: string): Promise<UserRow | undefined> {
  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query('SELECT id, email, username, role FROM "user" WHERE id = $1', [
      userId,
    ]);
    return res.rows[0];
  }
  if (dbInstance instanceof DatabaseSync) {
    return dbInstance
      .prepare('SELECT id, email, username, role FROM user WHERE id = ?')
      .get(userId) as UserRow | undefined;
  }
  return undefined;
}

/**
 * Lets an admin recover a player's account without email: mints a one-time
 * Better Auth reset token that the admin hands to the player out of band.
 * The player redeems it in the sign-in modal via authClient.resetPassword,
 * which consumes the token and revokes the player's existing sessions.
 */
export async function createPasswordResetCodeAction(payload: {
  targetUserId: string;
}): Promise<{ success: boolean; code?: string; expiresAt?: string; error?: string }> {
  try {
    await ensureAuthMigrations();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: 'Authentication required.' };
    }

    // Use the DB row rather than the session cookie so role changes apply immediately.
    const caller = await findUserRow(session.user.id);
    if (!caller) {
      return { success: false, error: 'Authentication required.' };
    }
    const isCallerRoot = isRootUser(caller);
    if (!isCallerRoot && caller.role !== 'admin') {
      return { success: false, error: 'Only admins can reset passwords.' };
    }

    const { targetUserId } = payload;
    if (!targetUserId) {
      return { success: false, error: 'Invalid user specified.' };
    }
    if (targetUserId === caller.id) {
      return { success: false, error: 'You cannot reset your own password here.' };
    }

    const target = await findUserRow(targetUserId);
    if (!target) {
      return { success: false, error: 'Target user not found.' };
    }
    if (isRootUser(target)) {
      return { success: false, error: 'The Root User password cannot be reset from the console.' };
    }
    if (target.role === 'admin' && !isCallerRoot) {
      return { success: false, error: 'Only the Root User can reset an admin password.' };
    }

    // Invalidate any earlier unused codes so only the newest one works.
    if (dbInstance instanceof Pool) {
      await dbInstance.query(
        `DELETE FROM "verification" WHERE value = $1 AND identifier LIKE 'reset-password:%'`,
        [target.id]
      );
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance
        .prepare(`DELETE FROM verification WHERE value = ? AND identifier LIKE 'reset-password:%'`)
        .run(target.id);
    }

    let code = '';
    for (let i = 0; i < RESET_CODE_LENGTH; i++) {
      code += RESET_CODE_ALPHABET[randomInt(RESET_CODE_ALPHABET.length)];
    }
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

    const ctx = await auth.$context;
    await ctx.internalAdapter.createVerificationValue({
      identifier: `reset-password:${code}`,
      value: target.id,
      expiresAt,
    });

    return {
      success: true,
      code: `${code.slice(0, 4)}-${code.slice(4)}`,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (err: unknown) {
    console.error('Failed to create password reset code:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create reset code.',
    };
  }
}
