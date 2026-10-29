'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { GameRecord } from '@/lib/games-db';
import { bundleGameSource } from '@/lib/game-bundler';
import { recordGamePlay } from '@/app/game-actions';

interface GamePlayerModalProps {
  game: GameRecord | null;
  onClose: () => void;
  onPlayRecorded?: (gameId: string, newCount: number) => void;
}

export function GamePlayerModal({ game, onClose, onPlayRecorded }: GamePlayerModalProps) {
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

  if (!game) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className={`relative flex flex-col bg-[#070a13] border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        {/* Game Topbar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0c101c] px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{game.icon || '🎮'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base tracking-tight">{game.title}</h3>
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/20">
                  {game.playCount + 1} Plays
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Created by</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <span>{game.authorAvatar}</span>
                  <span>{game.authorUsername}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
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
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            <button
              onClick={onClose}
              title="Close Game"
              className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Sandboxed Game Frame */}
        <div className="flex-1 bg-black relative">
          <iframe
            key={reloadKey}
            title={game.title}
            sandbox="allow-scripts allow-modals allow-pointer-lock"
            srcDoc={bundledHtml}
            className="w-full h-full border-0 absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
