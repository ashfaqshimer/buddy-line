'use client';

import React from 'react';
import { GameState } from '@/lib/game-types';
import {
  Cpu,
  Terminal,
  Code2,
  CheckCircle2,
  AlertOctagon,
  Bot,
  User,
  Shield,
  Zap,
} from 'lucide-react';

interface DevDrawerProps {
  state: GameState;
  visible: boolean;
}

export function DevDrawer({ state, visible }: DevDrawerProps) {
  if (!visible) return null;

  const { players, lastApiPayload, turnIndex, round } = state;

  return (
    <aside className="flex flex-col gap-5 animate-in slide-in-from-right duration-300">
      {/* 1. True Identities Inspector */}
      <section className="rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-400/[0.05] to-transparent p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-violet-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Dev Tools • Inspector</h3>
              <p className="text-[10px] text-violet-300/80">Real-time internal game state</p>
            </div>
          </div>
          <span className="rounded bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 text-[9px] font-mono font-bold text-violet-300">
            SIMULATOR
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            True Allegiance Matrix
          </div>
          {players.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-2.5 transition ${
                p.alignment === 'Replicant'
                  ? 'border-rose-400/30 bg-rose-400/[0.04]'
                  : 'border-white/[0.06] bg-[#0c1120]/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-6 items-center justify-center rounded-lg text-[10px] font-bold ${p.color}`}
                  >
                    {p.isBot ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{p.name}</span>
                      {!p.isAlive && (
                        <span className="text-[8px] text-rose-400 font-normal">
                          (Ejected)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{p.role}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      p.alignment === 'Replicant'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {p.alignment}
                  </span>
                </div>
              </div>

              {p.systemPrompt && (
                <div className="mt-2 rounded bg-black/40 border border-white/[0.04] p-1.5 font-mono text-[9px] text-slate-400 leading-snug">
                  <span className="text-violet-300 font-semibold">prompt: </span>
                  {p.systemPrompt}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Raw Simulated LLM Payload Inspector */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">LLM API Payload</h3>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            <span>200 OK</span>
          </span>
        </div>

        <pre className="overflow-x-auto rounded-xl bg-black/50 border border-white/[0.06] p-3 font-mono text-[10px] leading-relaxed text-slate-300 shadow-inner">
          {JSON.stringify(
            {
              status: 'success',
              endpoint: '/api/v1/gemini-bot-action',
              round,
              turn: turnIndex,
              activeSpeaker: state.activeSpeakerId,
              latestPayload: lastApiPayload || {
                model: 'gemini-1.5-flash-sim',
                turn: turnIndex,
                tokens: 184,
                latencyMs: 1980,
                timestamp: '09:42:00',
              },
            },
            null,
            2
          )}
        </pre>
        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
          <Zap className="size-3 text-cyan-400" />
          <span>Simulated Next.js Server Action with 2s synthetic latency</span>
        </div>
      </section>
    </aside>
  );
}
