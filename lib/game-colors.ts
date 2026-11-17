/**
 * Stable per-game cover tones for the typographic fallback cover.
 * Each game ID hashes to one of a small set of deep, muted backgrounds
 * with a lighter ink of the same hue, so a game keeps its colour everywhere.
 */
export interface CoverTone {
  name: string;
  bg: string;
  ink: string;
}

export const COVER_TONES: readonly CoverTone[] = [
  { name: 'oxblood', bg: '#3a171d', ink: '#ff9ea8' },
  { name: 'navy', bg: '#16233d', ink: '#9cc0ff' },
  { name: 'pine', bg: '#12302b', ink: '#7ee0cf' },
  { name: 'plum', bg: '#2e1a33', ink: '#e0a8f0' },
  { name: 'umber', bg: '#33241a', ink: '#f0c48a' },
  { name: 'olive', bg: '#262c17', ink: '#cfe08a' },
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
