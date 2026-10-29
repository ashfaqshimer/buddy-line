'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, RotateCcw, Trash2 } from 'lucide-react';
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

  // Handle Escape key to close the game if not in browser fullscreen
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

  // Attempt entering native browser fullscreen on open
  useEffect(() => {
    if (containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // Silently catch if browser requires direct user interaction or rejects
      });
    }
  }, []);

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

  const bundledHtml = bundleGameSource(
    game.htmlContent,
    game.cssContent,
    game.jsContent
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col w-screen h-screen bg-[#070a13] animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Game Topbar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0c101c]/95 backdrop-blur px-4 py-2.5 sm:px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{game.icon || '🎮'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-base tracking-tight truncate">{game.title}</h3>
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/20 shrink-0">
                {game.playCount + 1} Plays
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
              <span>Created by</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <span>{game.authorAvatar}</span>
                <span className="truncate">{game.authorUsername}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canDelete && onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(game)}
              title="Delete this game"
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Restart Game"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={handleClose}
            title="Close Game (Esc)"
            className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Sandboxed Game Frame */}
      <div className="flex-1 bg-black relative w-full h-full overflow-hidden">
        <iframe
          key={reloadKey}
          title={game.title}
          sandbox="allow-scripts allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; pointer-lock"
          srcDoc={bundledHtml}
          className="w-full h-full border-0 absolute inset-0"
        />
      </div>
    </div>
  );
}
