// Shared avatar helpers (safe to import from both client and server code).
//
// A user's avatar lives in the Better Auth `user.image` column and is either:
//   - a preset icon (one of PRESET_AVATARS, an emoji string), or
//   - an image URL hosted on UploadThing (uploaded via the `avatarUploader` route).

export const DEFAULT_AVATAR = '👾';

export const PRESET_AVATARS = [
  '🚀', '👾', '🕹️', '🐱', '🤖', '🦊', '⚡', '🍕', '🛸', '🦄', '🏆', '⭐',
  '🐶', '🐼', '🐸', '🐙', '🦖', '🐲', '🦁', '🐧', '👻', '🧙‍♂️', '🥷', '👨‍🚀',
  '🎮', '🎯', '💎', '🔥', '🌈', '🍩', '🎸', '🏀',
] as const;

/** Hosts UploadThing serves files from. Only these are accepted for custom avatars. */
const ALLOWED_IMAGE_HOST_SUFFIXES = ['utfs.io', 'ufs.sh'];

export function isImageAvatar(value?: string | null): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export function isPresetAvatar(value?: string | null): boolean {
  return typeof value === 'string' && (PRESET_AVATARS as readonly string[]).includes(value);
}

export function isAllowedAvatarImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_IMAGE_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

/** A short, non-URL string we can safely render as text (emoji avatars). */
export function isTextAvatar(value?: string | null): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 16 && !isImageAvatar(value);
}
