'use server';

import { getAllGames, createGame, incrementPlayCount, GameRecord } from '@/lib/games-db';

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
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
}): Promise<{ success: boolean; game?: GameRecord; error?: string }> {
  try {
    if (!payload.title || !payload.title.trim()) {
      return { success: false, error: 'Please give your game a cool name!' };
    }
    if (!payload.htmlContent || !payload.htmlContent.trim()) {
      return { success: false, error: 'HTML file is required for your game.' };
    }

    const game = await createGame({
      title: payload.title.trim(),
      description: payload.description?.trim() || 'A fun community arcade game!',
      icon: payload.icon || '🎮',
      htmlContent: payload.htmlContent,
      cssContent: payload.cssContent || '',
      jsContent: payload.jsContent || '',
      authorId: payload.authorId || 'guest',
      authorUsername: payload.authorUsername || 'KidGamer',
      authorAvatar: payload.authorAvatar || '👾',
    });

    return { success: true, game };
  } catch (error: unknown) {
    console.error('Failed to upload game:', error);
    const msg = error instanceof Error ? error.message : 'Could not save game. Please try again!';
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
