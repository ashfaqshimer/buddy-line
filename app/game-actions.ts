'use server';

import {
  getAllGames,
  createGame,
  getGameById,
  deleteGame,
  incrementPlayCount,
  GameRecord,
} from '@/lib/games-db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getGames(): Promise<GameRecord[]> {
  try {
    return await getAllGames();
  } catch (error) {
    console.error('Failed to get games:', error);
    return [];
  }
}

export async function uploadGame(payload: {
  title: string;
  description: string;
  icon: string;
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  authorId?: string;
  authorUsername?: string;
  authorAvatar?: string;
}): Promise<{ success: boolean; game?: GameRecord; error?: string }> {
  try {
    if (!payload.title || !payload.title.trim()) {
      return { success: false, error: 'Please give your game a cool name!' };
    }
    if (!payload.htmlContent || !payload.htmlContent.trim()) {
      return { success: false, error: 'HTML file is required for your game.' };
    }

    // Verify session if present to bind authentic author ID
    let authorId = payload.authorId || 'guest';
    let authorUsername = payload.authorUsername || 'KidGamer';
    let authorAvatar = payload.authorAvatar || '👾';

    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        authorId = session.user.id;
        const u = session.user as { username?: string; name?: string; image?: string | null };
        authorUsername = u.username || u.name || authorUsername;
        authorAvatar = u.image || authorAvatar;
      }
    } catch {
      // Fallback to payload author details if session lookup is unavailable
    }

    const game = await createGame({
      title: payload.title.trim(),
      description: payload.description?.trim() || 'A fun community arcade game!',
      icon: payload.icon || '🎮',
      htmlContent: payload.htmlContent,
      cssContent: payload.cssContent || '',
      jsContent: payload.jsContent || '',
      authorId,
      authorUsername,
      authorAvatar,
    });

    return { success: true, game };
  } catch (error: unknown) {
    console.error('Failed to upload game:', error);
    const msg = error instanceof Error ? error.message : 'Could not save game. Please try again!';
    return { success: false, error: msg };
  }
}

export async function deleteGameAction(
  gameId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!gameId || !gameId.trim()) {
      return { success: false, error: 'Valid game ID is required.' };
    }

    // 1. Authenticate user from session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: 'You must be signed in to delete a game.',
      };
    }

    // 2. Fetch the target game
    const game = await getGameById(gameId);
    if (!game) {
      return { success: false, error: 'Game not found or already deleted.' };
    }

    // 3. Permission checks: Author OR Admin / Root
    const userRole = (session.user as { role?: string }).role;
    const adminEmails = (process.env.ADMIN_EMAILS || process.env.ROOT_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAuthor = game.authorId === session.user.id;
    const isAdmin =
      userRole === 'admin' ||
      userRole === 'root' ||
      (session.user.email ? adminEmails.includes(session.user.email.toLowerCase()) : false);

    if (!isAuthor && !isAdmin) {
      return {
        success: false,
        error: 'Permission denied: Only the creator of this game or an administrator can delete it.',
      };
    }

    // 4. Execute deletion
    const deleted = await deleteGame(gameId);
    if (!deleted) {
      return {
        success: false,
        error: 'Could not delete the game. It may have already been removed.',
      };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to delete game:', error);
    const msg =
      error instanceof Error ? error.message : 'Something went wrong while deleting the game.';
    return { success: false, error: msg };
  }
}

export async function recordGamePlay(gameId: string): Promise<number> {
  try {
    return await incrementPlayCount(gameId);
  } catch (error) {
    console.error('Failed to record play count:', error);
    return 0;
  }
}
