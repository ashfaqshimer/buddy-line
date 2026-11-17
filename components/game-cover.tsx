import React from 'react';
import { cn } from '@/lib/utils';
import { getCoverTone } from '@/lib/game-colors';

interface GameCoverProps {
  game: { id: string; title: string; thumbnailUrl?: string | null; authorUsername?: string };
  /** Small uppercase label in the top-left corner of the typographic cover. */
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const TITLE_SIZE = {
  sm: 'text-[17px]',
  md: 'text-[34px] sm:text-[38px]',
  lg: 'text-[48px] sm:text-[72px]',
};

/**
 * 16:9 game cover. Shows the uploaded thumbnail when present; otherwise a
 * typographic cover (title in condensed caps on the game's stable tone).
 */
export function GameCover({ game, label, size = 'md', className, children }: GameCoverProps) {
  const tone = getCoverTone(game.id);

  return (
    <div
      className={cn('relative aspect-video w-full overflow-hidden rounded-lg', className)}
      style={game.thumbnailUrl ? { backgroundColor: '#141417' } : { backgroundColor: tone.bg, color: tone.ink }}
    >
      {game.thumbnailUrl ? (
        <img src={game.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <>
          {label && size !== 'sm' && (
            <span className="absolute left-[7%] top-[9%] font-mono text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">
              {label}
            </span>
          )}
          <span
            className={cn(
              'display-condensed absolute inset-x-[7%] bottom-[9%] font-extrabold text-balance line-clamp-3',
              TITLE_SIZE[size]
            )}
          >
            {game.title}
          </span>
        </>
      )}
      {children}
    </div>
  );
}
