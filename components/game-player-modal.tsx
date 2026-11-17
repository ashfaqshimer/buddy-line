'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  Link2,
  Check,
  Gamepad2,
  ShieldCheck,
} from 'lucide-react';
import { GameRecord } from '@/lib/games-db';
import { bundleGameSource } from '@/lib/game-bundler';
import { recordGamePlay } from '@/app/game-actions';
import { VirtualGamepad } from './virtual-gamepad';
import { UserAvatar } from './user-avatar';
import { GameCover } from './game-cover';

interface GamePlayerModalProps {
  game: GameRecord | null;
  onClose: () => void;
  onPlayRecorded?: (gameId: string, newCount: number) => void;
  canDelete?: boolean;
  onDeleteRequest?: (game: GameRecord) => void;
}

export function GamePlayerModal({
  game,
  onClose,
  onPlayRecorded,
  canDelete,
  onDeleteRequest,
}: GamePlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentPlayCount, setCurrentPlayCount] = useState<number>(game?.playCount ?? 0);
  const [isGamepadVisible, setIsGamepadVisible] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(true);
  const recordedGameIdRef = useRef<string | null>(null);

  const gameId = game?.id;

  // Auto-detect touch device for initial gamepad visibility & fullscreen support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsGamepadVisible(isTouch);
      const fsSupported = Boolean(
        document.fullscreenEnabled ||
        (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
      );
      setCanFullscreen(fsSupported);
    }
  }, []);

  // Keep local play count in sync if game prop updates
  useEffect(() => {
    if (game?.playCount !== undefined) {
      setCurrentPlayCount(game.playCount);
    }
  }, [game?.id, game?.playCount]);

  useEffect(() => {
    if (!gameId) return;
    // Guard against multiple increments for the same game session
    if (recordedGameIdRef.current === gameId) return;
    recordedGameIdRef.current = gameId;

    recordGamePlay(gameId)
      .then((count) => {
        if (count > 0) {
          setCurrentPlayCount(count);
          onPlayRecorded?.(gameId, count);
        }
      })
      .catch((err) => {
        console.error('Failed to record game play:', err);
      });
  }, [gameId, onPlayRecorded]);

  // Synchronize fullscreen state with document fullscreen element
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!game) return null;

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
      }
    } catch {
      // Ignore unsupported browser errors
    }
  };

  const handleVirtualKeyEvent = (
    action: 'keydown' | 'keyup',
    keyConfig: { key: string; code: string; keyCode: number }
  ) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'BUDDY_LINE_KEY_EVENT',
          action,
          key: keyConfig.key,
          code: keyConfig.code,
          keyCode: keyConfig.keyCode,
        },
        '*'
      );
    } catch {
      // Ignore cross-origin frame postMessage error if any
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(`${window.location.href.split("#")[0]}#${game.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const bundledHtml = bundleGameSource(
    game.htmlContent,
    game.cssContent,
    game.jsContent
  );

  const hudButton =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground sm:px-3';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${game.title}`}
      className="anim-fade fixed inset-0 z-50 flex h-[100dvh] w-screen max-w-full select-none flex-col overflow-hidden bg-background"
    >
      {/* HUD */}
      <div className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-2 py-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button onClick={handleClose} className="icon-btn" title="Back to arcade (Esc)" aria-label="Close game">
            <X className="size-5" />
          </button>
          <GameCover game={game} size="sm" className="hidden w-16 shrink-0 rounded-lg sm:block" />
          <div className="min-w-0">
            <h3 className="font-display truncate text-sm font-bold text-foreground sm:text-[15px]">{game.title}</h3>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <UserAvatar inline avatar={game.authorAvatar} name={game.authorUsername} className="size-4 rounded-full text-[10px]" />
              <span className="truncate">{game.authorUsername}</span>
              <span aria-hidden className="text-subtle-foreground">·</span>
              <span className="shrink-0 tabular-nums">
                {currentPlayCount.toLocaleString()} {currentPlayCount === 1 ? 'play' : 'plays'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface p-1">
          <button
            onClick={() => setIsGamepadVisible(!isGamepadVisible)}
            title={isGamepadVisible ? 'Hide touch controls' : 'Show touch controls'}
            aria-pressed={isGamepadVisible}
            className={`${hudButton} ${isGamepadVisible ? '!bg-primary/15 !text-primary' : ''}`}
          >
            <Gamepad2 className="size-4" />
            <span className="hidden md:inline">Touch controls</span>
          </button>
          <button onClick={handleShare} title="Copy game link" className={hudButton}>
            {copiedLink ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
            <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
          <button onClick={() => setReloadKey((k) => k + 1)} title="Restart game" className={hudButton}>
            <RotateCcw className="size-4" />
            <span className="hidden md:inline">Restart</span>
          </button>
          {canFullscreen && (
            <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} className={hudButton}>
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          )}
          {canDelete && onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(game)}
              title="Delete game"
              className={`${hudButton} hover:!bg-rose-500/15 hover:!text-rose-300`}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete game</span>
            </button>
          )}
        </div>
      </div>

      {/* Sandboxed game frame */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          key={reloadKey}
          title={game.title}
          sandbox="allow-scripts allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; pointer-lock"
          srcDoc={bundledHtml}
          className="absolute inset-0 h-full w-full border-0 bg-black"
        />

        <VirtualGamepad
          isVisible={isGamepadVisible}
          onToggleVisibility={() => setIsGamepadVisible(!isGamepadVisible)}
          onKeyEvent={handleVirtualKeyEvent}
        />
      </div>

      {/* How to play */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <span className="tag tag-play shrink-0">How to play</span>
          <span className="truncate text-muted-foreground">{game.description || 'No instructions from the creator.'}</span>
        </div>
        <div className="hidden shrink-0 items-center gap-2 text-subtle-foreground sm:flex">
          <span><span className="kbd">Esc</span> to exit</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Sandboxed</span>
        </div>
      </div>
    </div>
  );
}
