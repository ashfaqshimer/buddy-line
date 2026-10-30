import { dbInstance, migrationDbInstance } from './auth';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export interface PlayerProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  image: string | null;
  role: string | null;
}

export interface FriendSummary {
  id: string; // friend's user id
  friendshipId: string;
  username: string;
  name: string;
  avatar: string;
  role: string;
  friendshipStatus: 'pending' | 'accepted' | 'declined';
  isSender: boolean;
  createdAt: string;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export interface FriendRequestItem {
  friendshipId: string;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  role: string;
  createdAt: string;
}

export interface PrivateMessageRecord {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ChatNotificationSummary {
  totalUnreadMessages: number;
  unreadBySender: Record<string, number>;
  incomingRequestsCount: number;
}

let chatTablesInitialized = false;

export async function ensureChatTables(): Promise<void> {
  if (chatTablesInitialized) return;

  try {
    if (migrationDbInstance instanceof Pool) {
      await migrationDbInstance.query(`
        CREATE TABLE IF NOT EXISTS public.friendships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          friend_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
        );

        CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
        CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
        CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

        CREATE TABLE IF NOT EXISTS public.private_messages (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_pm_sender_receiver ON public.private_messages(sender_id, receiver_id);
        CREATE INDEX IF NOT EXISTS idx_pm_receiver_sender ON public.private_messages(receiver_id, sender_id);
        CREATE INDEX IF NOT EXISTS idx_pm_receiver_unread ON public.private_messages(receiver_id, is_read);
      `);
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS friendships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          friend_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, friend_id)
        );

        CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
        CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
        CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

        CREATE TABLE IF NOT EXISTS private_messages (
          id TEXT PRIMARY KEY,
          sender_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          content TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          read_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_pm_sender_receiver ON private_messages(sender_id, receiver_id);
        CREATE INDEX IF NOT EXISTS idx_pm_receiver_sender ON private_messages(receiver_id, sender_id);
        CREATE INDEX IF NOT EXISTS idx_pm_receiver_unread ON private_messages(receiver_id, is_read);
      `);
    }
  } catch (err) {
    console.warn('ensureChatTables notice:', err);
  }

  chatTablesInitialized = true;
}

/**
 * Check whether two users are accepted friends
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  await ensureChatTables();
  if (userId1 === userId2) return false;

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query(
      `SELECT 1 FROM public.friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
         AND status = 'accepted' LIMIT 1`,
      [userId1, userId2]
    );
    return (res.rowCount ?? 0) > 0;
  } else if (dbInstance instanceof DatabaseSync) {
    const row = dbInstance
      .prepare(
        `SELECT 1 FROM friendships 
         WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
           AND status = 'accepted' LIMIT 1`
      )
      .get(userId1, userId2, userId2, userId1);
    return Boolean(row);
  }
  return false;
}

/**
 * Send a friend request or automatically accept if a reciprocal pending request already exists
 */
export async function sendFriendRequest(
  currentUserId: string,
  targetUsernameOrId: string
): Promise<{ success: boolean; status?: 'pending' | 'accepted'; error?: string; message?: string }> {
  await ensureChatTables();

  const trimmed = targetUsernameOrId.trim();
  if (!trimmed) {
    return { success: false, error: 'Please specify a player username or ID.' };
  }

  // Find target user
  let targetUser: { id: string; username: string | null; name: string } | null = null;
  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query(
      `SELECT id, username, name FROM "user" 
       WHERE id = $1 OR LOWER(username) = LOWER($2) OR LOWER(email) = LOWER($2) 
       LIMIT 1`,
      [trimmed, trimmed]
    );
    if (res.rows[0]) {
      targetUser = res.rows[0];
    }
  } else if (dbInstance instanceof DatabaseSync) {
    const row = dbInstance
      .prepare(
        `SELECT id, username, name FROM user 
         WHERE id = ? OR LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) 
         LIMIT 1`
      )
      .get(trimmed, trimmed, trimmed) as { id: string; username: string | null; name: string } | undefined;
    if (row) {
      targetUser = row;
    }
  }

  if (!targetUser) {
    return { success: false, error: 'Player not found with that username.' };
  }

  if (targetUser.id === currentUserId) {
    return { success: false, error: 'You cannot add yourself as a friend.' };
  }

  const targetId = targetUser.id;

  // Check existing relationship
  let existing: { id: string; user_id: string; friend_id: string; status: string } | null = null;
  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query(
      `SELECT id, user_id, friend_id, status FROM public.friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) 
       LIMIT 1`,
      [currentUserId, targetId]
    );
    if (res.rows[0]) existing = res.rows[0];
  } else if (dbInstance instanceof DatabaseSync) {
    const row = dbInstance
      .prepare(
        `SELECT id, user_id, friend_id, status FROM friendships 
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) 
         LIMIT 1`
      )
      .get(currentUserId, targetId, targetId, currentUserId) as { id: string; user_id: string; friend_id: string; status: string } | undefined;
    if (row) existing = row;
  }

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, error: 'You are already friends with this player!' };
    }

    // If current user is sender and status is pending
    if (existing.status === 'pending' && existing.user_id === currentUserId) {
      return { success: false, error: 'Friend request is already pending.' };
    }

    // If target user previously sent request to current user, auto-accept it!
    if (existing.status === 'pending' && existing.friend_id === currentUserId) {
      if (dbInstance instanceof Pool) {
        await dbInstance.query(
          `UPDATE public.friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [existing.id]
        );
      } else if (dbInstance instanceof DatabaseSync) {
        dbInstance
          .prepare(`UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .run(existing.id);
      }
      return {
        success: true,
        status: 'accepted',
        message: `You and @${targetUser.username || targetUser.name} are now friends!`,
      };
    }

    // If declined or reset, reactivate as pending from current user
    const newId = existing.id;
    if (dbInstance instanceof Pool) {
      await dbInstance.query(
        `UPDATE public.friendships 
         SET user_id = $1, friend_id = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [currentUserId, targetId, newId]
      );
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance
        .prepare(
          `UPDATE friendships 
           SET user_id = ?, friend_id = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`
        )
        .run(currentUserId, targetId, newId);
    }
    return {
      success: true,
      status: 'pending',
      message: `Friend request sent to @${targetUser.username || targetUser.name}!`,
    };
  }

  // Insert fresh friend request
  const newId = randomUUID();
  if (dbInstance instanceof Pool) {
    await dbInstance.query(
      `INSERT INTO public.friendships (id, user_id, friend_id, status) VALUES ($1, $2, $3, 'pending')`,
      [newId, currentUserId, targetId]
    );
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance
      .prepare(`INSERT INTO friendships (id, user_id, friend_id, status) VALUES (?, ?, ?, 'pending')`)
      .run(newId, currentUserId, targetId);
  }

  return {
    success: true,
    status: 'pending',
    message: `Friend request sent to @${targetUser.username || targetUser.name}!`,
  };
}

/**
 * Accept or decline a friend request
 */
export async function respondToFriendRequest(
  friendshipId: string,
  currentUserId: string,
  action: 'accept' | 'decline'
): Promise<{ success: boolean; error?: string; message?: string }> {
  await ensureChatTables();

  let friendship: { id: string; user_id: string; friend_id: string; status: string } | null = null;
  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query(
      `SELECT id, user_id, friend_id, status FROM public.friendships WHERE id = $1`,
      [friendshipId]
    );
    if (res.rows[0]) friendship = res.rows[0];
  } else if (dbInstance instanceof DatabaseSync) {
    const row = dbInstance
      .prepare(`SELECT id, user_id, friend_id, status FROM friendships WHERE id = ?`)
      .get(friendshipId) as { id: string; user_id: string; friend_id: string; status: string } | undefined;
    if (row) friendship = row;
  }

  if (!friendship) {
    return { success: false, error: 'Friend request not found.' };
  }

  // Only the recipient can accept or decline
  if (friendship.friend_id !== currentUserId) {
    return { success: false, error: 'You are not authorized to respond to this friend request.' };
  }

  if (action === 'accept') {
    if (dbInstance instanceof Pool) {
      await dbInstance.query(
        `UPDATE public.friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [friendshipId]
      );
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance
        .prepare(`UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(friendshipId);
    }
    return { success: true, message: 'Friend request accepted!' };
  } else {
    // Decline: remove the friendship record
    if (dbInstance instanceof Pool) {
      await dbInstance.query(`DELETE FROM public.friendships WHERE id = $1`, [friendshipId]);
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance.prepare(`DELETE FROM friendships WHERE id = ?`).run(friendshipId);
    }
    return { success: true, message: 'Friend request declined.' };
  }
}

/**
 * Remove an existing friendship
 */
export async function removeFriend(
  currentUserId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureChatTables();

  if (dbInstance instanceof Pool) {
    await dbInstance.query(
      `DELETE FROM public.friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [currentUserId, friendId]
    );
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance
      .prepare(
        `DELETE FROM friendships 
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`
      )
      .run(currentUserId, friendId, friendId, currentUserId);
  }

  return { success: true };
}

/**
 * Cancel an outgoing friend request
 */
export async function cancelFriendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  await ensureChatTables();

  if (dbInstance instanceof Pool) {
    await dbInstance.query(
      `DELETE FROM public.friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [currentUserId, targetUserId]
    );
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance
      .prepare(`DELETE FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'pending'`)
      .run(currentUserId, targetUserId);
  }

  return { success: true };
}

/**
 * Fetch all friends, incoming requests, and outgoing requests for a user
 */
export async function getFriendsAndRequests(currentUserId: string): Promise<{
  friends: FriendSummary[];
  incomingRequests: FriendRequestItem[];
  outgoingRequests: FriendRequestItem[];
}> {
  await ensureChatTables();

  if (dbInstance instanceof Pool) {
    // 1. Fetch accepted friends
    const friendsRes = await dbInstance.query<{
      friendship_id: string;
      status: string;
      created_at: Date;
      sender_id: string;
      friend_user_id: string;
      friend_name: string;
      friend_username: string | null;
      friend_image: string | null;
      friend_role: string | null;
    }>(
      `SELECT 
         f.id AS friendship_id,
         f.status,
         f.created_at,
         f.user_id AS sender_id,
         u.id AS friend_user_id,
         u.name AS friend_name,
         u.username AS friend_username,
         u.image AS friend_image,
         u.role AS friend_role
       FROM public.friendships f
       JOIN "user" u ON (
         CASE 
           WHEN f.user_id = $1 THEN f.friend_id 
           ELSE f.user_id 
         END = u.id
       )
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY f.updated_at DESC`,
      [currentUserId]
    );

    // Fetch latest message and unread count for each friend
    const pool = dbInstance;
    const friends: FriendSummary[] = await Promise.all(
      friendsRes.rows.map(async (row) => {
        const lastMsgRes = await pool.query<{
          id: string;
          content: string;
          sender_id: string;
          created_at: Date;
          is_read: boolean;
        }>(
          `SELECT id, content, sender_id, created_at, is_read 
           FROM public.private_messages
           WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
           ORDER BY created_at DESC LIMIT 1`,
          [currentUserId, row.friend_user_id]
        );

        const unreadRes = await pool.query<{ count: string }>(
          `SELECT COUNT(*)::text as count 
           FROM public.private_messages
           WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
          [row.friend_user_id, currentUserId]
        );

        const lastMsg = lastMsgRes.rows[0];

        return {
          id: row.friend_user_id,
          friendshipId: row.friendship_id,
          username: row.friend_username || row.friend_name.toLowerCase().replace(/\s+/g, ''),
          name: row.friend_name,
          avatar: row.friend_image || '👾',
          role: row.friend_role || 'user',
          friendshipStatus: 'accepted',
          isSender: row.sender_id === currentUserId,
          createdAt: row.created_at.toISOString(),
          unreadCount: parseInt(unreadRes.rows[0]?.count || '0', 10),
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                content: lastMsg.content,
                senderId: lastMsg.sender_id,
                createdAt: lastMsg.created_at.toISOString(),
                isRead: lastMsg.is_read,
              }
            : null,
        };
      })
    );

    // 2. Fetch incoming pending requests
    const incomingRes = await dbInstance.query<{
      friendship_id: string;
      created_at: Date;
      sender_id: string;
      name: string;
      username: string | null;
      image: string | null;
      role: string | null;
    }>(
      `SELECT 
         f.id AS friendship_id,
         f.created_at,
         f.user_id AS sender_id,
         u.name,
         u.username,
         u.image,
         u.role
       FROM public.friendships f
       JOIN "user" u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [currentUserId]
    );

    const incomingRequests: FriendRequestItem[] = incomingRes.rows.map((row) => ({
      friendshipId: row.friendship_id,
      userId: row.sender_id,
      name: row.name,
      username: row.username || row.name.toLowerCase().replace(/\s+/g, ''),
      avatar: row.image || '👾',
      role: row.role || 'user',
      createdAt: row.created_at.toISOString(),
    }));

    // 3. Fetch outgoing pending requests
    const outgoingRes = await dbInstance.query<{
      friendship_id: string;
      created_at: Date;
      target_id: string;
      name: string;
      username: string | null;
      image: string | null;
      role: string | null;
    }>(
      `SELECT 
         f.id AS friendship_id,
         f.created_at,
         f.friend_id AS target_id,
         u.name,
         u.username,
         u.image,
         u.role
       FROM public.friendships f
       JOIN "user" u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [currentUserId]
    );

    const outgoingRequests: FriendRequestItem[] = outgoingRes.rows.map((row) => ({
      friendshipId: row.friendship_id,
      userId: row.target_id,
      name: row.name,
      username: row.username || row.name.toLowerCase().replace(/\s+/g, ''),
      avatar: row.image || '👾',
      role: row.role || 'user',
      createdAt: row.created_at.toISOString(),
    }));

    return { friends, incomingRequests, outgoingRequests };
  } else if (dbInstance instanceof DatabaseSync) {
    // SQLite implementation
    const friendsRows = dbInstance
      .prepare(
        `SELECT 
           f.id AS friendship_id,
           f.status,
           f.created_at,
           f.user_id AS sender_id,
           u.id AS friend_user_id,
           u.name AS friend_name,
           u.username AS friend_username,
           u.image AS friend_image,
           u.role AS friend_role
         FROM friendships f
         JOIN user u ON (
           CASE 
             WHEN f.user_id = ? THEN f.friend_id 
             ELSE f.user_id 
           END = u.id
         )
         WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
         ORDER BY f.updated_at DESC`
      )
      .all(currentUserId, currentUserId, currentUserId) as Array<{
      friendship_id: string;
      status: string;
      created_at: string;
      sender_id: string;
      friend_user_id: string;
      friend_name: string;
      friend_username: string | null;
      friend_image: string | null;
      friend_role: string | null;
    }>;

    const sqlite = dbInstance;
    const friends: FriendSummary[] = friendsRows.map((row) => {
      const lastMsg = sqlite
        .prepare(
          `SELECT id, content, sender_id, created_at, is_read 
           FROM private_messages
           WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(currentUserId, row.friend_user_id, row.friend_user_id, currentUserId) as {
        id: string;
        content: string;
        sender_id: string;
        created_at: string;
        is_read: number;
      } | undefined;

      const unreadRow = sqlite
        .prepare(
          `SELECT COUNT(*) as count 
           FROM private_messages
           WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`
        )
        .get(row.friend_user_id, currentUserId) as { count: number } | undefined;

      return {
        id: row.friend_user_id,
        friendshipId: row.friendship_id,
        username: row.friend_username || row.friend_name.toLowerCase().replace(/\s+/g, ''),
        name: row.friend_name,
        avatar: row.friend_image || '👾',
        role: row.friend_role || 'user',
        friendshipStatus: 'accepted',
        isSender: row.sender_id === currentUserId,
        createdAt: row.created_at,
        unreadCount: unreadRow?.count || 0,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              senderId: lastMsg.sender_id,
              createdAt: lastMsg.created_at,
              isRead: Boolean(lastMsg.is_read),
            }
          : null,
      };
    });

    const incomingRows = dbInstance
      .prepare(
        `SELECT 
           f.id AS friendship_id,
           f.created_at,
           f.user_id AS sender_id,
           u.name,
           u.username,
           u.image,
           u.role
         FROM friendships f
         JOIN user u ON f.user_id = u.id
         WHERE f.friend_id = ? AND f.status = 'pending'
         ORDER BY f.created_at DESC`
      )
      .all(currentUserId) as Array<{
      friendship_id: string;
      created_at: string;
      sender_id: string;
      name: string;
      username: string | null;
      image: string | null;
      role: string | null;
    }>;

    const incomingRequests: FriendRequestItem[] = incomingRows.map((row) => ({
      friendshipId: row.friendship_id,
      userId: row.sender_id,
      name: row.name,
      username: row.username || row.name.toLowerCase().replace(/\s+/g, ''),
      avatar: row.image || '👾',
      role: row.role || 'user',
      createdAt: row.created_at,
    }));

    const outgoingRows = dbInstance
      .prepare(
        `SELECT 
           f.id AS friendship_id,
           f.created_at,
           f.friend_id AS target_id,
           u.name,
           u.username,
           u.image,
           u.role
         FROM friendships f
         JOIN user u ON f.friend_id = u.id
         WHERE f.user_id = ? AND f.status = 'pending'
         ORDER BY f.created_at DESC`
      )
      .all(currentUserId) as Array<{
      friendship_id: string;
      created_at: string;
      target_id: string;
      name: string;
      username: string | null;
      image: string | null;
      role: string | null;
    }>;

    const outgoingRequests: FriendRequestItem[] = outgoingRows.map((row) => ({
      friendshipId: row.friendship_id,
      userId: row.target_id,
      name: row.name,
      username: row.username || row.name.toLowerCase().replace(/\s+/g, ''),
      avatar: row.image || '👾',
      role: row.role || 'user',
      createdAt: row.created_at,
    }));

    return { friends, incomingRequests, outgoingRequests };
  }

  return { friends: [], incomingRequests: [], outgoingRequests: [] };
}

/**
 * Search players by username or display name with their relation to current user
 */
export async function searchPlayers(
  currentUserId: string,
  query: string,
  limit = 15
): Promise<Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>> {
  await ensureChatTables();

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  let candidates: PlayerProfile[] = [];

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<PlayerProfile>(
      `SELECT id, name, username, image, role 
       FROM "user" 
       WHERE id != $1 AND (LOWER(username) LIKE $2 OR LOWER(name) LIKE $2) 
       LIMIT $3`,
      [currentUserId, `%${trimmed}%`, limit]
    );
    candidates = res.rows;
  } else if (dbInstance instanceof DatabaseSync) {
    candidates = dbInstance
      .prepare(
        `SELECT id, name, username, image, role 
         FROM user 
         WHERE id != ? AND (LOWER(username) LIKE ? OR LOWER(name) LIKE ?) 
         LIMIT ?`
      )
      .all(currentUserId, `%${trimmed}%`, `%${trimmed}%`, limit) as unknown as PlayerProfile[];
  }

  // Annotate relationships
  const results = await Promise.all(
    candidates.map(async (player) => {
      let relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' = 'none';

      if (dbInstance instanceof Pool) {
        const relRes = await dbInstance.query<{ user_id: string; friend_id: string; status: string }>(
          `SELECT user_id, friend_id, status FROM public.friendships 
           WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) 
           LIMIT 1`,
          [currentUserId, player.id]
        );
        if (relRes.rows[0]) {
          const row = relRes.rows[0];
          if (row.status === 'accepted') relationship = 'friend';
          else if (row.status === 'pending') {
            relationship = row.user_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
          }
        }
      } else if (dbInstance instanceof DatabaseSync) {
        const row = dbInstance
          .prepare(
            `SELECT user_id, friend_id, status FROM friendships 
             WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) 
             LIMIT 1`
          )
          .get(currentUserId, player.id, player.id, currentUserId) as {
          user_id: string;
          friend_id: string;
          status: string;
        } | undefined;
        if (row) {
          if (row.status === 'accepted') relationship = 'friend';
          else if (row.status === 'pending') {
            relationship = row.user_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
          }
        }
      }

      return {
        ...player,
        username: player.username || player.name.toLowerCase().replace(/\s+/g, ''),
        relationship,
      };
    })
  );

  return results;
}

/**
 * Get suggested players in the arcade that the current user is not friends with
 */
export async function getSuggestedPlayers(
  currentUserId: string,
  limit = 8
): Promise<Array<PlayerProfile & { relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' }>> {
  await ensureChatTables();

  let candidates: PlayerProfile[] = [];

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<PlayerProfile>(
      `SELECT u.id, u.name, u.username, u.image, u.role 
       FROM "user" u
       WHERE u.id != $1
         AND u.id NOT IN (
           SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END
           FROM public.friendships
           WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
         )
       ORDER BY u."createdAt" DESC
       LIMIT $2`,
      [currentUserId, limit]
    );
    candidates = res.rows;
  } else if (dbInstance instanceof DatabaseSync) {
    candidates = dbInstance
      .prepare(
        `SELECT u.id, u.name, u.username, u.image, u.role 
         FROM user u
         WHERE u.id != ?
           AND u.id NOT IN (
             SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
             FROM friendships
             WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
           )
         ORDER BY u.createdAt DESC
         LIMIT ?`
      )
      .all(currentUserId, currentUserId, currentUserId, currentUserId, limit) as unknown as PlayerProfile[];
  }

  // Annotate relationships (could be pending outgoing/incoming)
  const results = await Promise.all(
    candidates.map(async (player) => {
      let relationship: 'none' | 'pending_incoming' | 'pending_outgoing' | 'friend' = 'none';

      if (dbInstance instanceof Pool) {
        const relRes = await dbInstance.query<{ user_id: string; friend_id: string; status: string }>(
          `SELECT user_id, friend_id, status FROM public.friendships 
           WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) 
           LIMIT 1`,
          [currentUserId, player.id]
        );
        if (relRes.rows[0]) {
          const row = relRes.rows[0];
          if (row.status === 'accepted') relationship = 'friend';
          else if (row.status === 'pending') {
            relationship = row.user_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
          }
        }
      } else if (dbInstance instanceof DatabaseSync) {
        const row = dbInstance
          .prepare(
            `SELECT user_id, friend_id, status FROM friendships 
             WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) 
             LIMIT 1`
          )
          .get(currentUserId, player.id, player.id, currentUserId) as {
          user_id: string;
          friend_id: string;
          status: string;
        } | undefined;
        if (row) {
          if (row.status === 'accepted') relationship = 'friend';
          else if (row.status === 'pending') {
            relationship = row.user_id === currentUserId ? 'pending_outgoing' : 'pending_incoming';
          }
        }
      }

      return {
        ...player,
        username: player.username || player.name.toLowerCase().replace(/\s+/g, ''),
        relationship,
      };
    })
  );

  return results;
}

/**
 * Fetch private messages between current user and a friend (and mark them as read)
 */
export async function getConversation(
  currentUserId: string,
  friendId: string,
  limit = 100
): Promise<{ success: boolean; messages?: PrivateMessageRecord[]; error?: string }> {
  await ensureChatTables();

  const friends = await areFriends(currentUserId, friendId);
  if (!friends) {
    return {
      success: false,
      error: 'You can only exchange private messages with accepted friends.',
    };
  }

  // Mark all unread messages from this friend as read
  if (dbInstance instanceof Pool) {
    await dbInstance.query(
      `UPDATE public.private_messages 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [friendId, currentUserId]
    );

    const res = await dbInstance.query<{
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      is_read: boolean;
      read_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, sender_id, receiver_id, content, is_read, read_at, created_at
       FROM public.private_messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC
       LIMIT $3`,
      [currentUserId, friendId, limit]
    );

    const messages: PrivateMessageRecord[] = res.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: row.is_read,
      readAt: row.read_at ? row.read_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
    }));

    return { success: true, messages };
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance
      .prepare(
        `UPDATE private_messages 
         SET is_read = 1, read_at = CURRENT_TIMESTAMP 
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`
      )
      .run(friendId, currentUserId);

    const rows = dbInstance
      .prepare(
        `SELECT id, sender_id, receiver_id, content, is_read, read_at, created_at
         FROM private_messages
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at ASC
         LIMIT ?`
      )
      .all(currentUserId, friendId, friendId, currentUserId, limit) as Array<{
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      is_read: number;
      read_at: string | null;
      created_at: string;
    }>;

    const messages: PrivateMessageRecord[] = rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: Boolean(row.is_read),
      readAt: row.read_at,
      createdAt: row.created_at,
    }));

    return { success: true, messages };
  }

  return { success: true, messages: [] };
}

/**
 * Send a private message to an accepted friend
 */
export async function sendPrivateMessage(
  currentUserId: string,
  friendId: string,
  content: string
): Promise<{ success: boolean; message?: PrivateMessageRecord; error?: string }> {
  await ensureChatTables();

  const trimmed = (content || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  if (trimmed.length > 2000) {
    return { success: false, error: 'Message exceeds the 2,000 character limit.' };
  }

  const friends = await areFriends(currentUserId, friendId);
  if (!friends) {
    return {
      success: false,
      error: 'You can only send private messages to accepted friends.',
    };
  }

  const messageId = randomUUID();
  const now = new Date().toISOString();

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<{
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      is_read: boolean;
      read_at: Date | null;
      created_at: Date;
    }>(
      `INSERT INTO public.private_messages (id, sender_id, receiver_id, content, is_read, created_at)
       VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
       RETURNING id, sender_id, receiver_id, content, is_read, read_at, created_at`,
      [messageId, currentUserId, friendId, trimmed]
    );

    const row = res.rows[0];
    return {
      success: true,
      message: {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        isRead: row.is_read,
        readAt: row.read_at ? row.read_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
      },
    };
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance
      .prepare(
        `INSERT INTO private_messages (id, sender_id, receiver_id, content, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`
      )
      .run(messageId, currentUserId, friendId, trimmed, now);

    return {
      success: true,
      message: {
        id: messageId,
        senderId: currentUserId,
        receiverId: friendId,
        content: trimmed,
        isRead: false,
        readAt: null,
        createdAt: now,
      },
    };
  }

  return { success: false, error: 'Database instance unavailable.' };
}

/**
 * Get notification summary for badges (total unread messages and incoming friend requests)
 */
export async function getChatNotificationSummary(
  currentUserId: string
): Promise<ChatNotificationSummary> {
  await ensureChatTables();

  let totalUnread = 0;
  const unreadBySender: Record<string, number> = {};
  let incomingRequestsCount = 0;

  if (dbInstance instanceof Pool) {
    const unreadRes = await dbInstance.query<{ sender_id: string; count: string }>(
      `SELECT sender_id, COUNT(*)::text as count 
       FROM public.private_messages 
       WHERE receiver_id = $1 AND is_read = FALSE 
       GROUP BY sender_id`,
      [currentUserId]
    );

    for (const row of unreadRes.rows) {
      const cnt = parseInt(row.count, 10);
      unreadBySender[row.sender_id] = cnt;
      totalUnread += cnt;
    }

    const reqRes = await dbInstance.query<{ count: string }>(
      `SELECT COUNT(*)::text as count 
       FROM public.friendships 
       WHERE friend_id = $1 AND status = 'pending'`,
      [currentUserId]
    );
    incomingRequestsCount = parseInt(reqRes.rows[0]?.count || '0', 10);
  } else if (dbInstance instanceof DatabaseSync) {
    const unreadRows = dbInstance
      .prepare(
        `SELECT sender_id, COUNT(*) as count 
         FROM private_messages 
         WHERE receiver_id = ? AND is_read = 0 
         GROUP BY sender_id`
      )
      .all(currentUserId) as Array<{ sender_id: string; count: number }>;

    for (const row of unreadRows) {
      unreadBySender[row.sender_id] = row.count;
      totalUnread += row.count;
    }

    const reqRow = dbInstance
      .prepare(`SELECT COUNT(*) as count FROM friendships WHERE friend_id = ? AND status = 'pending'`)
      .get(currentUserId) as { count: number } | undefined;
    incomingRequestsCount = reqRow?.count || 0;
  }

  return {
    totalUnreadMessages: totalUnread,
    unreadBySender,
    incomingRequestsCount,
  };
}
