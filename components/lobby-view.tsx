'use client';

import React from 'react';
import { GameState, MatchSettings } from '@/lib/game-types';
import {
  Rocket,
  Gauge,
  Bot,
  User,
  Sliders,
  ShieldAlert,
  Sparkles,
  Info,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface LobbyViewProps {
  state: GameState;
  onUpdateSettings: (settings: Partial<MatchSettings>) => void;
  onLaunchMission: () => void;
}

export function LobbyView({ state, onUpdateSettings, onLaunchMission }: LobbyViewProps) {
  const { settings, players } = state;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] max-w-6xl mx-auto">
      {/* Left Column: Assembled Crew / Joined Players */}
      <section className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-sm shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              <Sparkles className="size-3" />
              <span>Briefing Room</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Assemble Your Crew</h2>
            <p className="text-xs text-slate-400 mt-1">
              {players.length} members boarded the ISS Astraeus. Ready for deep-space departure.
            </p>
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
            <CheckCircle2 className="size-3.5" />
            <span>All Crew Ready</span>
          </div>
        </div>

        {/* Players Roster */}
        <div className="grid gap-3 sm:grid-cols-2 flex-1">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0c1120]/80 p-3.5 transition hover:border-cyan-400/30 hover:bg-[#0e1629]"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-black text-xs shadow-md ${p.color}`}
              >
                {p.isBot ? <Bot className="size-5" /> : <User className="size-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">{p.name}</span>
                  {p.isBot ? (
                    <span className="rounded bg-violet-400/15 border border-violet-400/30 px-1.5 py-0.2 text-[9px] font-bold text-violet-300">
                      BOT
                    </span>
                  ) : (
                    <span className="rounded bg-cyan-400/15 border border-cyan-400/30 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300">
                      HOST
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Assigned Station: <span className="text-slate-300 font-medium">{p.role}</span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>
          ))}
        </div>

        {/* Launch Trigger Button */}
        <div className="mt-8 pt-4 border-t border-white/[0.08]">
          <button
            onClick={onLaunchMission}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 px-6 py-4 text-sm font-black tracking-wide text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:brightness-105 active:scale-[0.99]"
          >
            <Rocket className="size-5 transition-transform group-hover:-translate-y-0.5" />
            <span>LAUNCH MISSION</span>
          </button>
          <div className="mt-2 text-center text-[11px] text-slate-500">
            Host has operational authority. All connected players will enter the active mission.
          </div>
        </div>
      </section>

      {/* Right Column: Mission Parameters / Match Settings */}
      <section className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-sm shadow-xl">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/30">
              <Sliders className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Match Settings</h2>
              <p className="text-xs text-slate-400">Host controls mission difficulty & duration</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Setting 1: Bot Count (2 - 5) */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1120]/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <label htmlFor="bot-count-slider" className="text-sm font-semibold text-slate-200">
                    Bot Crewmates
                  </label>
                  <p className="text-[11px] text-slate-400">Autonomous AI bots simulated on server</p>
                </div>
                <span className="font-mono text-base font-bold text-cyan-300 bg-cyan-400/10 px-2.5 py-0.5 rounded-lg border border-cyan-400/20">
                  {settings.botCount}
                </span>
              </div>
              <input
                id="bot-count-slider"
                type="range"
                min={2}
                max={5}
                value={settings.botCount}
                onChange={(e) => onUpdateSettings({ botCount: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>Min: 2</span>
                <span>Configured: {settings.botCount} Bots</span>
                <span>Max: 5</span>
              </div>
            </div>

            {/* Setting 2: Replicant Count (1 - 2) */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1120]/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <label htmlFor="replicant-slider" className="text-sm font-semibold text-slate-200">
                    Replicant Count
                  </label>
                  <p className="text-[11px] text-slate-400">Hidden saboteurs attempting to bring down Astraeus</p>
                </div>
                <span className="font-mono text-base font-bold text-rose-300 bg-rose-400/10 px-2.5 py-0.5 rounded-lg border border-rose-400/20">
                  {settings.replicantCount}
                </span>
              </div>
              <input
                id="replicant-slider"
                type="range"
                min={1}
                max={2}
                value={settings.replicantCount}
                onChange={(e) => onUpdateSettings({ replicantCount: parseInt(e.target.value, 10) })}
                className="w-full accent-rose-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>Min: 1 Replicant</span>
                <span>Configured: {settings.replicantCount}</span>
                <span>Max: 2 Replicants</span>
              </div>
            </div>

            {/* Setting 3: Turn Limit per round (5 - 15) */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1120]/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <label htmlFor="turn-limit-slider" className="text-sm font-semibold text-slate-200">
                    Turn Limit per Round
                  </label>
                  <p className="text-[11px] text-slate-400">Turns elapsed before mandatory emergency vote</p>
                </div>
                <span className="font-mono text-base font-bold text-violet-300 bg-violet-400/10 px-2.5 py-0.5 rounded-lg border border-violet-400/20">
                  {settings.turnLimit}
                </span>
              </div>
              <input
                id="turn-limit-slider"
                type="range"
                min={5}
                max={15}
                value={settings.turnLimit}
                onChange={(e) => onUpdateSettings({ turnLimit: parseInt(e.target.value, 10) })}
                className="w-full accent-violet-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>Fast: 5 turns</span>
                <span>Configured: {settings.turnLimit} turns</span>
                <span>Standard: 15 turns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Directive Notice */}
        <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4 text-xs text-slate-300 flex items-start gap-3">
          <ShieldAlert className="size-5 shrink-0 text-cyan-400 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-cyan-200">Classified Mission Briefing</div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Each crewmate will receive their secret allegiance (<strong className="text-emerald-300">Loyal</strong> vs{' '}
              <strong className="text-rose-300">Replicant</strong>) on departure. Replicants must evade detection while sabotaging life support.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
