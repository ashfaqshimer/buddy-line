import { cn } from './utils';

/**
 * Buddy Line "Night Arcade" design tokens & class presets.
 * Mirrors app/globals.css. See docs/STYLING.md.
 */

export const colors = {
  background: '#090a14',
  surface: '#11132a',
  surfaceRaised: '#191c3a',
  surfaceSunken: '#06070f',
  border: 'rgba(165, 180, 252, 0.1)',
  borderStrong: 'rgba(165, 180, 252, 0.2)',

  /** Play / primary actions (logo's left fist). */
  play: { DEFAULT: '#38bdf8', hover: '#7dd3fc', ink: '#03131f' },
  /** Social features (logo's right fist). */
  social: { DEFAULT: '#a78bfa', hover: '#c4b5fd', ink: '#150a33' },

  brandGradient: 'linear-gradient(115deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',

  text: {
    primary: '#eef0ff',
    muted: '#a3a7c9',
    subtle: '#6d7199',
  },
} as const;

/** Class presets built on the component classes in globals.css. */
export const tokens = {
  card: 'card',
  panel: 'panel',
  input: 'field',
  label: 'field-label',
  buttonPrimary: 'btn btn-primary',
  buttonBrand: 'btn btn-brand',
  buttonSocial: 'btn btn-social',
  buttonSecondary: 'btn btn-secondary',
  buttonGhost: 'btn btn-ghost',
  buttonDanger: 'btn btn-danger',
  badgeCount: 'count-badge',
  tagAdmin: 'tag tag-admin',
  tagMuted: 'tag tag-muted',
  eyebrow: 'eyebrow',
} as const;

/**
 * Utility helper to join token classes with custom classes
 */
export function tokenClass(base: keyof typeof tokens, ...extras: (string | undefined | null | false)[]) {
  return cn(tokens[base], ...extras);
}
