'use client';

import React from 'react';
import { GameState } from '@/lib/game-types';
import {
  AlertTriangle,
  ShieldAlert,
  Bot,
  User,
  Radio,
  Flame,
  Check,
} from 'lucide-react';

interface VotingModalProps {
  state: GameState;
  onSelectEjection: (playerId: string) => void;
  onConfirmEjection: () => void;
}

export function VotingModal({
  state,
  onSelectEjection,
  onConfirmEjection,
}: VotingModalProps) {
  const { players, selectedEjectionId } = state;
  const survivingCrew = players.filter((p) => p.isAlive && p.id !== 'player-you');
  const selectedCrew = players.find((p) => p.id === selectedEjectionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-rose-500/30 bg-[#0f1422] p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

        {/* Modal Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-400">
              <ShieldAlert className="size-4 animate-bounce" />
              <span>Emergency Sector Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Eject A Suspected Replicant
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              The turn limit for this round has expired. Cast your vote to eject a crewmate into the airlock.
            </p>
          </div>

          <div className="hidden sm:flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
            <Flame className="size-6" />
          </div>
        </div>

        {/* Surviving Crew Voting Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {survivingCrew.map((crew) => {
            const isSelected = selectedEjectionId === crew.id;
            return (
              <button
                key={crew.id}
                onClick={() => onSelectEjection(crew.id)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-rose-400 bg-rose-500/15 shadow-[0_0_25px_rgba(244,63,94,0.25)] ring-2 ring-rose-400/40'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-md ${crew.color}`}
                >
                  {crew.isBot ? <Bot className="size-6" /> : <User className="size-6" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-bold text-white">{crew.name}</span>
                    {isSelected && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-slate-950 font-bold">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Station: {crew.role}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {crew.isBot ? 'Autonomous Crewmate' : 'Human Crewmate'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Confirmation Bar */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onConfirmEjection}
            disabled={!selectedEjectionId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 px-6 py-4 text-sm font-black tracking-wide text-white shadow-[0_0_30px_rgba(244,63,94,0.3)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            <AlertTriangle className="size-4" />
            <span>
              {selectedCrew
                ? `CONFIRM EJECTION OF ${selectedCrew.name.toUpperCase()}`
                : 'SELECT A CREWMATE TO EJECT'}
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-500">
            Ejection is permanent and will instantly reveal their true allegiance.
          </p>
        </div>
      </div>
    </div>
  );
}
