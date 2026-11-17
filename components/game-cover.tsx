import React from 'react';
import { cn } from '@/lib/utils';
import { coverBackground, getCoverTone } from '@/lib/game-colors';

interface GameCoverProps {
  game: { id: string; title: string; icon?: string | null; thumbnailUrl?: string | null };
  /** Small label pinned to the top-left corner of the cover. */
  label?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const TITLE_SIZE = {
  sm: '',
  md: 'text-[19px] sm:text-[21px]',
  lg: 'text-[26px] sm:text-[40px]',
};

const ICON_SIZE = {
  sm: 'text-[28px]',
  md: 'text-[44px] sm:text-[52px]',
  lg: 'text-[64px] sm:text-[104px]',
};

/** Emoji badges are short strings; anything else (URLs, long text) is ignored. */
function displayIcon(icon?: string | null): string | null {
  if (!icon) return null;
  const value = icon.trim();
  if (!value || value.length > 8 || /^https?:/i.test(value)) return null;
  return value;
}

/**
 * 16:9 game cover. Shows the uploaded thumbnail when present; otherwise a
 * neon "cartridge": the game's emoji over a perspective grid, with the title
 * in the display face, all on the game's stable colour tone.
 */
export function GameCover({ game, label, size = 'md', className, children }: GameCoverProps) {
  const tone = getCoverTone(game.id);
  const icon = displayIcon(game.icon);

  return (
    <div
      className={cn('relative aspect-video w-full overflow-hidden rounded-xl', className)}
      style={game.thumbnailUrl ? { backgroundColor: tone.base } : { background: coverBackground(tone), color: tone.ink }}
    >
      {game.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={game.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <>
          <div aria-hidden className="cover-grid absolute inset-0" />
          {icon && (
            <span
              aria-hidden
              className={cn(
                'absolute select-none leading-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]',
                size === 'sm' ? 'inset-0 flex items-center justify-center' : 'right-[7%] top-[12%] rotate-[8deg]',
                ICON_SIZE[size]
              )}
            >
              {icon}
            </span>
          )}
          {size !== 'sm' && (
            <span
              className={cn(
                'font-display absolute inset-x-[7%] bottom-[10%] text-left font-bold leading-[1.05] text-balance line-clamp-2',
                icon && 'pr-[28%]',
                TITLE_SIZE[size]
              )}
            >
              {game.title}
            </span>
          )}
          {size === 'sm' && !icon && (
            <span className="font-display absolute inset-0 flex items-center justify-center text-lg font-bold">
              {game.title.slice(0, 1).toUpperCase()}
            </span>
          )}
        </>
      )}
      {/* Inner hairline so covers sit crisply on dark surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
      {label && (
        <span className="absolute left-3 top-3 sm:left-4 sm:top-4">{label}</span>
      )}
      {children}
    </div>
  );
}
