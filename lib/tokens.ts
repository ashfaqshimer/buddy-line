import { cn } from './utils';

/**
 * Buddy Line "Gallery" design tokens & class presets.
 * Neutral near-black surfaces, hairline borders, 8px corners, no glows.
 * Teal is the single action colour. See docs/STYLING.md.
 */

export const colors = {
  background: '#0d0d0f',
  surface: '#141417',
  surfaceRaised: '#1b1b1f',
  surfaceSunken: '#0a0a0c',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  teal: {
    DEFAULT: '#2dd4bf',
    hover: '#5eead4',
    ink: '#04201c',
  },

  text: {
    primary: '#ededf0',
    muted: '#9a9aa3',
    subtle: '#66666f',
  },
} as const;

export const shadows = {
  overlay: '0 24px 48px -12px rgba(0, 0, 0, 0.6)',
} as const;

/**
 * Standard Reusable Class Presets
 */
export const tokens = {
  // Surfaces
  card: 'rounded-xl border border-border bg-surface',
  cardRaised: 'rounded-xl border border-border bg-surface-raised',
  cardInteractive: 'transition-colors duration-200 hover:border-border-strong cursor-pointer',

  // Containers
  panel: 'border border-border bg-background/90 backdrop-blur-md',
  modal: 'rounded-xl border border-border bg-surface shadow-2xl shadow-black/50',

  // Inputs
  input: 'w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none transition',
  inputRounded: 'w-full rounded-lg border border-border bg-surface-sunken px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none transition',

  // Buttons
  buttonTeal: 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-teal-300 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  buttonOutline: 'inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-foreground hover:bg-white/[0.05] transition active:scale-[0.98] disabled:opacity-50',
  buttonMuted: 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition active:scale-[0.98] disabled:opacity-50',
  buttonDestructive: 'inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition active:scale-[0.98] disabled:opacity-50',

  // Badges
  badgeTeal: 'inline-flex items-center gap-1 rounded border border-teal-400/30 px-1.5 py-px font-mono text-[10px] text-teal-300',
  badgeAmber: 'inline-flex items-center gap-1 rounded border border-amber-400/30 px-1.5 py-px font-mono text-[10px] text-amber-300',
  badgeMuted: 'inline-flex items-center gap-1 rounded border border-border px-1.5 py-px font-mono text-[10px] text-muted-foreground',
  badgeDestructive: 'inline-flex items-center gap-1 rounded border border-rose-500/30 px-1.5 py-px font-mono text-[10px] text-rose-300',

  // Type
  label: 'font-mono text-[11px] uppercase tracking-[0.12em] text-subtle-foreground',
  meta: 'font-mono text-xs text-muted-foreground tabular-nums',
} as const;

/**
 * Utility helper to join token classes with custom classes
 */
export function tokenClass(base: keyof typeof tokens, ...extras: (string | undefined | null | false)[]) {
  return cn(tokens[base], ...extras);
}
