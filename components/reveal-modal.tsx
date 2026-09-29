'use client';

import React from 'react';
import { GameState } from '@/lib/game-types';
import {
  Skull,
  ShieldCheck,
  RotateCcw,
  Play,
  Bot,
  User,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';

interface RevealModalProps {
  state: GameState;
  onNextRound: () => void;
  onResetToLobby: () => void;
}

export function RevealModal({ state, onNextRound, onResetToLobby }: RevealModalProps) {
  const { ejectedPlayer, players, round } = state;

  if (!ejectedPlayer) return null;

  const isReplicant = ejectedPlayer.alignment === 'Replicant';
  const remainingReplicants = players.filter((p) => p.isAlive && p.alignment === 'Replicant').length;
  const survivingCrew = players.filter((p) => p.isAlive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in zoom-in-95 duration-300">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl text-center ${
          isReplicant
            ? 'border-emerald-500/40 bg-gradient-to-b from-[#0d1f19] to-[#0a101b] shadow-[0_0_60px_rgba(16,185,129,0.25)]'
            : 'border-rose-500/40 bg-gradient-to-b from-[#210e14] to-[#0a101b] shadow-[0_0_60px_rgba(244,63,94,0.25)]'
        }`}
      >
        {/* Animated Badge */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/[0.05] ring-2 ring-white/10 shadow-xl">
          {isReplicant ? (
            <ShieldCheck className="size-8 text-emerald-400 animate-pulse" />
          ) : (
            <Skull className="size-8 text-rose-400 animate-pulse" />
          )}
        </div>

        {/* Ejection Announcement */}
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-1">
          Airlock Depressurization Completed
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {ejectedPlayer.name} Was Ejected
        </h2>

        {/* True Identity Banner */}
        <div
          className={`mx-auto inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 my-4 text-base font-black uppercase tracking-wider ${
            isReplicant
              ? 'border-emerald-400/40 bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
              : 'border-rose-400/40 bg-rose-400/20 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
          }`}
        >
          {isReplicant ? (
            <span>They Were A Replicant!</span>
          ) : (
            <span>They Were Loyal To The Crew!</span>
          )}
        </div>

        {/* Status Report */}
        <div className="mx-auto max-w-sm rounded-xl border border-white/[0.08] bg-black/40 p-4 text-xs text-slate-300 my-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Station Role:</span>
            <span className="font-semibold text-white">{ejectedPlayer.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Remaining Crew:</span>
            <span className="font-mono font-bold text-cyan-300">{survivingCrew} Surviving</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Replicants Still Unfound:</span>
            <span className={`font-mono font-bold ${remainingReplicants > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {remainingReplicants} Remaining
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {remainingReplicants > 0 && survivingCrew > 2 ? (
            <button
              onClick={onNextRound}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition hover:brightness-110"
            >
              <Play className="size-4" />
              <span>Proceed to Round {round + 1}</span>
            </button>
          ) : (
            <div className="flex-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs font-bold text-emerald-300">
              {remainingReplicants === 0
                ? 'All Replicants neutralized! Crew victory!'
                : 'Replicants have overtaken the Astraeus!'}
            </div>
          )}

          <button
            onClick={onResetToLobby}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <RotateCcw className="size-4" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
}
