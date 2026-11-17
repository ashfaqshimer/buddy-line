/**
 * Stable per-game cover tones for the typographic fallback cover.
 * Each game ID hashes to one neon "cartridge" palette, so a game keeps
 * its colour everywhere (grid, featured banner, player HUD).
 */
export interface CoverTone {
  name: string;
  /** Deep base colour of the cover. */
  base: string;
  /** Saturated highlight that blooms from the top-right corner. */
  hi: string;
  /** Text colour for the title on this tone. */
  ink: string;
  /** Translucent glow used for hover shadows around the game card. */
  glow: string;
}

export const COVER_TONES: readonly CoverTone[] = [
  { name: 'cyan', base: '#0a2238', hi: '#0e7490', ink: '#a5f3fc', glow: 'rgba(34, 211, 238, 0.45)' },
  { name: 'violet', base: '#1a1038', hi: '#6d28d9', ink: '#ddd6fe', glow: 'rgba(139, 92, 246, 0.5)' },
  { name: 'magenta', base: '#260d2a', hi: '#be185d', ink: '#fbcfe8', glow: 'rgba(236, 72, 153, 0.45)' },
  { name: 'lime', base: '#0e2113', hi: '#4d7c0f', ink: '#d9f99d', glow: 'rgba(132, 204, 22, 0.4)' },
  { name: 'amber', base: '#271507', hi: '#b45309', ink: '#fde68a', glow: 'rgba(245, 158, 11, 0.42)' },
  { name: 'indigo', base: '#10153d', hi: '#4338ca', ink: '#c7d2fe', glow: 'rgba(99, 102, 241, 0.5)' },
  { name: 'coral', base: '#290e0e', hi: '#c2410c', ink: '#fed7aa', glow: 'rgba(249, 115, 22, 0.42)' },
] as const;

function hashString(value: string): number {
  // FNV-1a, 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getCoverTone(gameId: string): CoverTone {
  return COVER_TONES[hashString(gameId) % COVER_TONES.length];
}

/** CSS background for a typographic cover on the given tone. */
export function coverBackground(tone: CoverTone): string {
  return `radial-gradient(120% 120% at 100% 0%, ${tone.hi} 0%, transparent 62%), linear-gradient(180deg, ${tone.base} 0%, #07080f 100%)`;
}
