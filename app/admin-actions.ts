'use server';

import { auth, dbInstance, isRootUser, ensureAuthMigrations } from '@/lib/auth';
import { headers } from 'next/headers';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';

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
    return isRootUser(session.user as { email?: string; username?: string });
  } catch (err) {
    console.error('Failed to check root user status:', err);
    return false;
  }
}

export async function getUsersListAction(): Promise<{
  success: boolean;
  users?: UserSummary[];
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

    return { success: true, users };
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
