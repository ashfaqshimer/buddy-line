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
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    '🔥': 14,
    '🚀': 9,
    '🕹️': 23,
    '⭐': 18,
  });
  const [userReacted, setUserReacted] = useState<string | null>(null);
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
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReaction = (emoji: string) => {
    if (userReacted === emoji) return;
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
    setUserReacted(emoji);
  };

  const bundledHtml = bundleGameSource(
    game.htmlContent,
    game.cssContent,
    game.jsContent
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col w-screen h-[100dvh] max-w-full bg-[#111419] animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Top Arcade HUD Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#1a1f27]/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] shrink-0 z-10 shadow-lg gap-2">
        {/* Left: Game Branding & Creator Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-400/20 text-xl sm:text-2xl shadow-inner shrink-0 overflow-hidden">
            {game.thumbnailUrl ? (
              <img src={game.thumbnailUrl} alt={game.title} className="size-full object-cover rounded-xl" />
            ) : (
              game.icon || '🎮'
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-black text-white text-sm sm:text-base tracking-tight truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                {game.title}
              </h3>
              <span className="rounded-full bg-teal-400/8 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-teal-300 border border-teal-400/15 shrink-0">
                {currentPlayCount} {currentPlayCount === 1 ? 'Play' : 'Plays'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 truncate">
              <span>By</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">
                <span>{game.authorAvatar}</span>
                <span className="truncate">{game.authorUsername}</span>
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
                : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="size-3.5" />
            <span className="hidden sm:inline">Touch Keys</span>
          </button>

          {/* Community Reactions Quick Pill (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                  userReacted === emoji
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{count}</span>
              </button>
            ))}
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            title="Share Game"
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
          >
            {copiedLink ? <Check className="size-3.5 text-teal-400" /> : <Share2 className="size-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Restart Game"
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Fullscreen Button (if supported) */}
          {canFullscreen && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition min-h-[38px]"
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
              className="flex items-center justify-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/8 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition min-h-[38px]"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Close Game Button */}
          <button
            onClick={handleClose}
            title="Close Game (Esc)"
            className="flex size-9 sm:size-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Sandboxed Game Frame with Ambient Glow */}
      <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.04)_0%,transparent_70%)] pointer-events-none" />

        <iframe
          ref={iframeRef}
          key={reloadKey}
          title={game.title}
          sandbox="allow-scripts allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; pointer-lock"
          srcDoc={bundledHtml}
          className="w-full h-full border-0 absolute inset-0 bg-[#111419]"
        />

        {/* Mobile Virtual Gamepad Overlay */}
        <VirtualGamepad
          isVisible={isGamepadVisible}
          onToggleVisibility={() => setIsGamepadVisible(!isGamepadVisible)}
          onKeyEvent={handleVirtualKeyEvent}
        />
      </div>

      {/* Bottom Mini Controls Info Strip */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#1a1f27] px-4 py-1.5 text-[11px] text-slate-400 shrink-0 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-teal-400 font-bold flex items-center gap-1 shrink-0">
            <GiJoystick className="size-3.5" />
            <span>Controls:</span>
          </span>
          <span className="truncate max-w-sm sm:max-w-xl">{game.description}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500 shrink-0">
          <span>Press <kbd className="rounded bg-white/[0.08] px-1 py-0.5 text-[10px] text-slate-300">Esc</kbd> to exit</span>
          <span>•</span>
          <span className="text-teal-400/90 font-medium">Safe Sandboxed Iframe</span>
        </div>
      </div>
    </div>
  );
}
