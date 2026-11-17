'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Trash2,
  Share2,
  Check,
  Gamepad2,
} from 'lucide-react';
import { GiJoystick } from 'react-icons/gi';
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col w-screen h-[100dvh] max-w-full bg-surface-sunken animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Top Arcade HUD Bar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-3 sm:px-6 py-2 sm:py-2.5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] shrink-0 z-10 gap-2">
        {/* Left: Game Branding & Creator Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <GameCover game={game} size="sm" className="hidden sm:block w-16 shrink-0 rounded-md" />

          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">
              {game.title}
            </h3>
            <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs text-muted-foreground truncate">
              <UserAvatar inline avatar={game.authorAvatar} name={game.authorUsername} className="size-4 rounded-full text-[10px]" />
              <span className="truncate max-w-[90px] sm:max-w-none">{game.authorUsername}</span>
              <span aria-hidden className="text-subtle-foreground">·</span>
              <span className="shrink-0 tabular-nums">
                {currentPlayCount} {currentPlayCount === 1 ? 'play' : 'plays'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: HUD Control Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Virtual Controls Toggle Button (Quick on-screen controls access) */}
          <button
            onClick={() => setIsGamepadVisible(!isGamepadVisible)}
            title="Toggle Mobile Touch Controls"
            className={`flex items-center gap-1 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition min-h-[38px] ${
              isGamepadVisible
                ? 'border-teal-400/40 bg-teal-400/15 text-teal-300'
                : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="size-3.5" />
            <span className="hidden sm:inline">Touch Keys</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            title="Share Game"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
          >
            {copiedLink ? <Check className="size-3.5 text-teal-400" /> : <Share2 className="size-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Restart Game"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Fullscreen Button (if supported) */}
          {canFullscreen && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          )}

          {/* Delete Button (Authorized Only) */}
          {canDelete && onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(game)}
              title="Delete Game"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/8 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition min-h-[38px]"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Close Game Button */}
          <button
            onClick={handleClose}
            title="Close Game (Esc)"
            className="flex size-9 sm:size-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Sandboxed Game Frame */}
      <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex items-center justify-center">

        <iframe
          ref={iframeRef}
          key={reloadKey}
          title={game.title}
          sandbox="allow-scripts allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; pointer-lock"
          srcDoc={bundledHtml}
          className="w-full h-full border-0 absolute inset-0 bg-surface-sunken"
        />

        {/* Mobile Virtual Gamepad Overlay */}
        <VirtualGamepad
          isVisible={isGamepadVisible}
          onToggleVisibility={() => setIsGamepadVisible(!isGamepadVisible)}
          onKeyEvent={handleVirtualKeyEvent}
        />
      </div>

      {/* Bottom Mini Controls Info Strip */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-surface px-4 py-1.5 text-[11px] text-zinc-400 shrink-0 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-teal-400 font-bold flex items-center gap-1 shrink-0">
            <GiJoystick className="size-3.5" />
            <span>Controls:</span>
          </span>
          <span className="truncate max-w-sm sm:max-w-xl">{game.description}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-zinc-500 shrink-0">
          <span>Press <kbd className="rounded bg-white/[0.08] px-1 py-0.5 text-[10px] text-zinc-300">Esc</kbd> to exit</span>
          <span>•</span>
          <span className="text-teal-400/90 font-medium">Safe Sandboxed Iframe</span>
        </div>
      </div>
    </div>
  );
}
