'use client';

import React from 'react';
import {
  Rocket,
  Activity,
  Users,
  Radio,
  Gamepad2,
  Sparkles,
  Signal,
  Layers,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  activeSection?: string;
}

export function Sidebar({ activeSection = 'game' }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[#0b0f1c] px-4 py-6 lg:flex">
      {/* Platform Branding: Buddy Line Parent */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Radio className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">BUDDY LINE</span>
              <span className="rounded bg-cyan-400/10 px-1 py-0.5 text-[9px] font-semibold text-cyan-300">
                PLATFORM
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Multiplayer Ecosystem
            </p>
          </div>
        </div>
      </div>

      {/* Sub-app Navigation: Nebula Hub */}
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            <span>Nebula Hub</span>
            <Sparkles className="size-3 text-cyan-400" />
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <a
              href="#game"
              className="group flex items-center gap-3 rounded-xl bg-cyan-400/10 px-3 py-2.5 font-medium text-cyan-200 ring-1 ring-cyan-300/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all hover:bg-cyan-400/15"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
                <Rocket className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-semibold text-white">Deep Space Sabotage</span>
                <span className="text-[10px] text-cyan-300/70">Text Deduction</span>
              </div>
              <span className="ml-auto flex size-2 rounded-full bg-cyan-400 animate-pulse" />
            </a>

            <div className="pt-2 px-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Other Hub Modules
            </div>

            <button
              disabled
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-60"
            >
              <Compass className="size-4" />
              <span>Solaris Deck (Upcoming)</span>
            </button>
            <button
              disabled
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-60"
            >
              <Gamepad2 className="size-4" />
              <span>Asteroid Arena (Upcoming)</span>
            </button>
          </nav>
        </div>

        {/* Global Social & Platform Sessions */}
        <div>
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sessions & Squad
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            <a
              href="#sessions"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-colors hover:bg-white/[0.05]"
            >
              <Activity className="size-4 text-emerald-400" />
              <span>Active Sessions</span>
              <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-400/20">
                1 Live
              </span>
            </a>
            <a
              href="#friends"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-colors hover:bg-white/[0.05]"
            >
              <Users className="size-4 text-violet-400" />
              <span>Friends List</span>
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                4 Online
              </span>
            </a>
          </nav>
        </div>
      </div>

      {/* Sector Network Status Footer */}
      <div className="mt-auto rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-3.5 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-200">Sector Relay: Active</span>
          </div>
          <Signal className="size-3.5 text-emerald-400" />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          5,842 crew online in Astraeus Sector. Relay ping: <span className="font-mono text-cyan-300">18ms</span>.
        </p>
      </div>
    </aside>
  );
}
