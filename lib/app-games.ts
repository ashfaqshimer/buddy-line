import { dbInstance, migrationDbInstance } from './auth';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';

export interface AppGame {
  id: string;
  title: string;
  description: string;
  icon: string;
  sectionKey: string;
  category: 'official' | 'community';
  isHidden: boolean;
  releaseDate?: string | null;
  updatedAt: string;
}

interface RawAppGameRow {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  section_key: string;
  category: string;
  is_hidden: boolean | number;
  release_date: Date | string | null;
  updated_at: Date | string | null;
}

export const DEFAULT_APP_GAMES: AppGame[] = [
  {
    id: 'deep-space',
    title: 'Deep Space Sabotage',
    description: 'Unmask the hidden Replicants before oxygen and reactor systems fail on the ISS Astraeus.',
    icon: 'Rocket',
    sectionKey: 'game',
    category: 'official',
    isHidden: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'solaris-deck',
    title: 'Solaris Deck',
    description: 'Tactical starship deck defense & resource strategy. (In Development)',
    icon: 'Compass',
    sectionKey: 'solaris',
    category: 'official',
    isHidden: true,
    updatedAt: new Date().toISOString(),
  },
];

let tableInitialized = false;

export async function ensureAppGamesTable(): Promise<void> {
  if (tableInitialized) return;

  if (migrationDbInstance instanceof Pool) {
    await migrationDbInstance.query(`
      CREATE TABLE IF NOT EXISTS app_games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL,
        section_key TEXT NOT NULL,
        category TEXT DEFAULT 'official',
        is_hidden BOOLEAN DEFAULT FALSE,
        release_date TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const check = await migrationDbInstance.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM app_games'
    );
    const count = parseInt(check.rows[0]?.count || '0', 10);

    if (count === 0) {
      for (const game of DEFAULT_APP_GAMES) {
        await migrationDbInstance.query(
          `INSERT INTO app_games (id, title, description, icon, section_key, category, is_hidden, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO NOTHING`,
          [
            game.id,
            game.title,
            game.description,
            game.icon,
            game.sectionKey,
            game.category,
            game.isHidden,
          ]
        );
      }
    }
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS app_games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL,
        section_key TEXT NOT NULL,
        category TEXT DEFAULT 'official',
        is_hidden INTEGER DEFAULT 0,
        release_date TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const check = dbInstance.prepare('SELECT COUNT(*) as count FROM app_games').get() as {
      count: number;
    };
    if (!check || check.count === 0) {
      const insert = dbInstance.prepare(`
        INSERT OR IGNORE INTO app_games (id, title, description, icon, section_key, category, is_hidden, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      for (const game of DEFAULT_APP_GAMES) {
        insert.run(
          game.id,
          game.title,
          game.description,
          game.icon,
          game.sectionKey,
          game.category,
          game.isHidden ? 1 : 0
        );
      }
    }
  }

  tableInitialized = true;
}

export async function getAppGames(includeHidden: boolean = false): Promise<AppGame[]> {
  await ensureAppGamesTable();

  try {
    if (dbInstance instanceof Pool) {
      const query = includeHidden
        ? 'SELECT * FROM app_games ORDER BY id ASC'
        : 'SELECT * FROM app_games WHERE is_hidden = FALSE ORDER BY id ASC';
      const res = await dbInstance.query<RawAppGameRow>(query);

      return res.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        icon: row.icon,
        sectionKey: row.section_key,
        category: (row.category as 'official' | 'community') || 'official',
        isHidden: Boolean(row.is_hidden),
        releaseDate: row.release_date
          ? row.release_date instanceof Date
            ? row.release_date.toISOString()
            : String(row.release_date)
          : null,
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : String(row.updated_at || new Date().toISOString()),
      }));
    } else if (dbInstance instanceof DatabaseSync) {
      const query = includeHidden
        ? 'SELECT * FROM app_games ORDER BY id ASC'
        : 'SELECT * FROM app_games WHERE is_hidden = 0 ORDER BY id ASC';
      const rows = dbInstance.prepare(query).all() as unknown as RawAppGameRow[];

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        icon: row.icon,
        sectionKey: row.section_key,
        category: (row.category as 'official' | 'community') || 'official',
        isHidden: Boolean(row.is_hidden),
        releaseDate: row.release_date ? String(row.release_date) : null,
        updatedAt: String(row.updated_at || new Date().toISOString()),
      }));
    }
  } catch (err) {
    console.error('Error fetching app games from DB:', err);
  }

  // Fallback to default in-memory list
  if (includeHidden) {
    return DEFAULT_APP_GAMES;
  }
  return DEFAULT_APP_GAMES.filter((g) => !g.isHidden);
}

export async function setAppGameVisibility(
  gameId: string,
  isHidden: boolean
): Promise<AppGame | null> {
  await ensureAppGamesTable();

  try {
    if (dbInstance instanceof Pool) {
      const res = await dbInstance.query<RawAppGameRow>(
        `UPDATE app_games 
         SET is_hidden = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [isHidden, gameId]
      );

      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        icon: row.icon,
        sectionKey: row.section_key,
        category: (row.category as 'official' | 'community') || 'official',
        isHidden: Boolean(row.is_hidden),
        releaseDate: row.release_date
          ? row.release_date instanceof Date
            ? row.release_date.toISOString()
            : String(row.release_date)
          : null,
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : String(row.updated_at || new Date().toISOString()),
      };
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance
        .prepare('UPDATE app_games SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(isHidden ? 1 : 0, gameId);

      const row = dbInstance
        .prepare('SELECT * FROM app_games WHERE id = ?')
        .get(gameId) as unknown as RawAppGameRow | undefined;

      if (!row) return null;
      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        icon: row.icon,
        sectionKey: row.section_key,
        category: (row.category as 'official' | 'community') || 'official',
        isHidden: Boolean(row.is_hidden),
        releaseDate: row.release_date ? String(row.release_date) : null,
        updatedAt: String(row.updated_at || new Date().toISOString()),
      };
    }
  } catch (err) {
    console.error('Error updating app game visibility in DB:', err);
  }

  const existing = DEFAULT_APP_GAMES.find((g) => g.id === gameId);
  if (existing) {
    existing.isHidden = isHidden;
    return existing;
  }
  return null;
}
