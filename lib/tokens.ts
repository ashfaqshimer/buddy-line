import { cn } from './utils';

/**
 * Buddy Line Reusable Design Tokens & Class Presets
 * Inspired by dark neumorphic UI with glowing teal accents.
 */

export const colors = {
  background: '#151920',
  surface: '#1c2028',
  surfaceRaised: '#22272f',
  surfaceSunken: '#111419',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  
  teal: {
    DEFAULT: '#2dd4bf',
    muted: '#14b8a6',
    dim: 'rgba(45, 212, 191, 0.12)',
    glow: 'rgba(45, 212, 191, 0.25)',
    border: 'rgba(45, 212, 191, 0.25)',
  },

  text: {
    primary: '#ffffff',
    secondary: '#e8eaed',
    muted: '#94a3b8',
    subtle: '#64748b',
    teal: '#2dd4bf',
    tealLight: '#5eead4',
  },
} as const;

export const shadows = {
  raised: '6px 6px 16px rgba(0, 0, 0, 0.45), -4px -4px 12px rgba(255, 255, 255, 0.02)',
  raisedSubtle: '4px 4px 12px rgba(0, 0, 0, 0.35), -2px -2px 8px rgba(255, 255, 255, 0.01)',
  inset: 'inset 2px 2px 6px rgba(0, 0, 0, 0.4), inset -1px -1px 4px rgba(255, 255, 255, 0.01)',
  tealGlow: '0 0 24px rgba(45, 212, 191, 0.2)',
  tealGlowBold: '0 0 35px rgba(45, 212, 191, 0.4)',
} as const;

/**
 * Standard Reusable Class Presets
 */
export const tokens = {
  // Surfaces & Cards
  card: 'rounded-2xl border border-white/[0.06] bg-[#1c2028] shadow-[6px_6px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.02)]',
  cardRaised: 'rounded-2xl border border-white/[0.08] bg-[#22272f] shadow-[6px_6px_16px_rgba(0,0,0,0.45),-3px_-3px_10px_rgba(255,255,255,0.02)]',
  cardInteractive: 'transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:shadow-[6px_6px_16px_rgba(0,0,0,0.4),0_0_24px_rgba(45,212,191,0.15)] cursor-pointer',
  
  // Containers
  panel: 'border border-white/[0.06] bg-[#1a1f27]/90 backdrop-blur-xl',
  modal: 'rounded-2xl border border-white/[0.08] bg-[#1c2028] shadow-[6px_6px_20px_rgba(0,0,0,0.5)]',
  
  // Inputs & Controls
  input: 'w-full rounded-full border border-white/[0.08] bg-[#151920] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)]',
  inputRounded: 'w-full rounded-2xl border border-white/[0.08] bg-[#151920] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3)]',

  // Buttons (Pill & Soft Shapes)
  buttonTeal: 'flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_30px_rgba(45,212,191,0.45)] transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
  buttonOutline: 'flex items-center justify-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/8 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-400/15 hover:border-teal-400/40 transition active:scale-95 disabled:opacity-50',
  buttonMuted: 'flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition active:scale-95 disabled:opacity-50',
  buttonDestructive: 'flex items-center justify-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition active:scale-95 disabled:opacity-50',

  // Badges & Tags
  badgeTeal: 'inline-flex items-center gap-1.5 rounded-full bg-teal-400/10 border border-teal-400/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-300',
  badgeAmber: 'inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300',
  badgeMuted: 'inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-slate-400',
  badgeDestructive: 'inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300',

  // Glows & Effects
  glowTeal: 'shadow-[0_0_24px_rgba(45,212,191,0.25)]',
  glowTealBold: 'shadow-[0_0_35px_rgba(45,212,191,0.45)]',
} as const;

/**
 * Utility helper to join token classes with custom classes
 */
export function tokenClass(base: keyof typeof tokens, ...extras: (string | undefined | null | false)[]) {
  return cn(tokens[base], ...extras);
}
