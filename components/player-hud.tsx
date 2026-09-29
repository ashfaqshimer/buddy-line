'use client';

import React from 'react';
import { GameState, Deduction } from '@/lib/game-types';
import {
  Activity,
  Zap,
  Eye,
  EyeOff,
  ClipboardList,
  Shield,
  AlertTriangle,
  Bot,
  User,
  HeartPulse,
} from 'lucide-react';

interface PlayerHudProps {
  state: GameState;
  onToggleRoleReveal: () => void;
  onSetDeduction: (playerId: string, deduction: Deduction) => void;
  onSetNote: (playerId: string, note: string) => void;
}

export function PlayerHud({
  state,
  onToggleRoleReveal,
  onSetDeduction,
  onSetNote,
}: PlayerHudProps) {
  const { shipStatus, roleRevealed, players, deductions, notes } = state;
  const userPlayer = players.find((p) => p.id === 'player-you') || players[0];

  const deductionOptions: Deduction[] = ['Unknown', 'Safe', 'Suspicious', 'Replicant'];

  const getDeductionBadgeStyle = (deduction: Deduction) => {
    switch (deduction) {
      case 'Safe':
        return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
      case 'Suspicious':
        return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
      case 'Replicant':
        return 'border-rose-500/40 text-rose-400 bg-rose-500/10';
      default:
        return 'border-slate-700 text-slate-400 bg-slate-800/40';
    }
  };

  return (
    <aside className="flex flex-col gap-5">
      {/* 1. Ship Status Bars */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Ship Telemetry</h3>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              shipStatus.oxygen > 50
                ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                : 'bg-rose-400/15 text-rose-300 border border-rose-400/30 animate-pulse'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                shipStatus.oxygen > 50 ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {shipStatus.oxygen > 50 ? 'Systems Nominal' : 'Vulnerability'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Oxygen Level */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <HeartPulse className="size-3.5 text-cyan-400" />
                <span>Atmospheric Oxygen</span>
              </span>
              <span className="font-mono font-bold text-cyan-300">{shipStatus.oxygen}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                style={{ width: `${shipStatus.oxygen}%` }}
              />
            </div>
          </div>

          {/* Reactor Stability */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Zap className="size-3.5 text-amber-400" />
                <span>Reactor Core Integrity</span>
              </span>
              <span className="font-mono font-bold text-amber-300">{shipStatus.reactor}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all duration-500"
                style={{ width: `${shipStatus.reactor}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Role Reveal Card */}
      <section className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.06] to-transparent p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Classified Dossier</h3>
          </div>
          <button
            onClick={onToggleRoleReveal}
            className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 transition"
          >
            {roleRevealed ? (
              <>
                <EyeOff className="size-3.5" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                <span>Reveal</span>
              </>
            )}
          </button>
        </div>

        <div
          onClick={onToggleRoleReveal}
          className="cursor-pointer rounded-xl border border-white/10 bg-[#0c1120]/90 p-4 transition hover:border-cyan-400/40 hover:bg-[#0e1629]"
        >
          {roleRevealed ? (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Assigned Station</div>
                  <div className="text-lg font-black text-cyan-300">{userPlayer.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Allegiance</div>
                  <div className="inline-block rounded-md bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {userPlayer.alignment}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.08] text-[11px] leading-relaxed text-slate-300">
                Identify and eject all hidden <strong className="text-rose-400">Replicants</strong> before life support reaches zero. Maintain systems and record suspicious communications.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 text-center">
              <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 mb-2">
                <Eye className="size-4" />
              </div>
              <div className="text-xs font-semibold text-cyan-200">Tap to Reveal Your Role</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Kept hidden from other players</div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Deduction Notepad */}
      <section className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Deduction Notepad</h3>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Live Notes</span>
        </div>

        <div className="space-y-3">
          {players
            .filter((p) => p.id !== 'player-you')
            .map((crew) => {
              const currentDeduction = deductions[crew.id] || 'Unknown';
              const currentNote = notes[crew.id] || '';

              return (
                <div
                  key={crew.id}
                  className={`rounded-xl border p-3 transition ${
                    crew.isAlive
                      ? 'border-white/[0.06] bg-[#0c1120]/70'
                      : 'border-white/[0.03] bg-black/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${crew.color}`}
                      >
                        {crew.isBot ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                      </div>
                      <span className="truncate text-xs font-semibold text-white">
                        {crew.name}
                      </span>
                      {!crew.isAlive && (
                        <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[8px] font-bold text-rose-300 uppercase">
                          Ejected
                        </span>
                      )}
                    </div>

                    {/* Verdict Select */}
                    <select
                      value={currentDeduction}
                      onChange={(e) => onSetDeduction(crew.id, e.target.value as Deduction)}
                      disabled={!crew.isAlive}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold outline-none cursor-pointer transition ${getDeductionBadgeStyle(
                        currentDeduction
                      )}`}
                    >
                      {deductionOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Freeform Notes on this crewmate */}
                  <input
                    type="text"
                    value={currentNote}
                    onChange={(e) => onSetNote(crew.id, e.target.value)}
                    disabled={!crew.isAlive}
                    placeholder="Log suspicious behavior, alibis..."
                    className="w-full rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-400/40"
                  />
                </div>
              );
            })}
        </div>
      </section>
    </aside>
  );
}
