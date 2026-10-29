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
} from 'lucide-react';
import { GiGameConsole, GiJoystick } from 'react-icons/gi';
import { GameRecord } from '@/lib/games-db';
import { bundleGameSource } from '@/lib/game-bundler';
import { recordGamePlay } from '@/app/game-actions';

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

  const gameId = game?.id;

  useEffect(() => {
    if (gameId) {
      recordGamePlay(gameId).then((count) => {
        if (count > 0 && onPlayRecorded) {
          onPlayRecorded(gameId, count);
        }
      });
    }
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
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
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
      className="fixed inset-0 z-50 flex flex-col w-screen h-screen bg-[#07080e] animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Top Arcade HUD Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0c0e18]/95 backdrop-blur-md px-4 sm:px-6 py-2.5 shrink-0 z-10 shadow-lg">
        {/* Left: Game Branding & Creator Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-violet-500/20 border border-emerald-400/30 text-2xl shadow-inner shrink-0">
            {game.icon || '🎮'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base tracking-tight truncate">
                {game.title}
              </h3>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/20 shrink-0">
                {game.playCount + 1} Plays
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
              <span>By</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <span>{game.authorAvatar}</span>
                <span className="truncate">{game.authorUsername}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: HUD Control Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Community Reactions Quick Pill */}
          <div className="hidden md:flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/5">
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                  userReacted === emoji
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            {copiedLink ? <Check className="size-3.5 text-emerald-400" /> : <Share2 className="size-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Restart Game"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          {/* Delete Button (Authorized Only) */}
          {canDelete && onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(game)}
              title="Delete Game"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Close Game Button */}
          <button
            onClick={handleClose}
            title="Close Game (Esc)"
            className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Sandboxed Game Frame with Ambient Neon Glow */}
      <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,231,166,0.06)_0%,transparent_70%)] pointer-events-none" />

        <iframe
          key={reloadKey}
          title={game.title}
          sandbox="allow-scripts allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; pointer-lock"
          srcDoc={bundledHtml}
          className="w-full h-full border-0 absolute inset-0 bg-[#060810]"
        />
      </div>

      {/* Bottom Mini Controls Info Strip */}
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#090b14] px-4 py-1.5 text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <GiJoystick className="size-3.5" />
            <span>Controls:</span>
          </span>
          <span className="truncate max-w-xl">{game.description}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500">
          <span>Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-slate-300">Esc</kbd> to exit</span>
          <span>•</span>
          <span className="text-emerald-400/90 font-medium">Safe Sandboxed Iframe</span>
        </div>
      </div>
    </div>
  );
}
