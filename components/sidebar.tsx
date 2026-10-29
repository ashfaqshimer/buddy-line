'use client';

import React from 'react';
import {
  Rocket,
  Activity,
  Users,
  Gamepad2,
  Sparkles,
  Signal,
  Compass,
  EyeOff,
  Settings,
  Shield,
  Layers,
  Crown,
} from 'lucide-react';
import { AppGame } from '@/lib/app-games';

interface SidebarProps {
  activeSection?: string;
  onSelectSection?: (section: 'game' | 'arcade') => void;
  appGames?: AppGame[];
  isAdmin?: boolean;
  isRoot?: boolean;
  onOpenAdminManager?: () => void;
}

export function Sidebar({
  activeSection = 'game',
  onSelectSection,
  appGames = [],
  isAdmin = false,
  isRoot = false,
  onOpenAdminManager,
}: SidebarProps) {
  // Find Deep Space game status
  const deepSpaceGame = appGames.find((g) => g.id === 'deep-space');
  const isDeepSpaceHidden = deepSpaceGame ? deepSpaceGame.isHidden : false;

  // Show Deep Space if it is NOT hidden, OR if the current user is an Admin/Root
  const showDeepSpace = !isDeepSpaceHidden || isAdmin;

  // Solaris Deck placeholder status
  const solarisGame = appGames.find((g) => g.id === 'solaris-deck');
  const isSolarisHidden = solarisGame ? solarisGame.isHidden : true;
  const showSolaris = !isSolarisHidden || isAdmin;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[#0b0f1c] px-4 py-6 lg:flex">
      {/* Platform Branding: Nebula Gaming Hub */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            <Gamepad2 className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">NEBULA HUB</span>
              <span className="rounded bg-cyan-400/10 px-1 py-0.5 text-[9px] font-semibold text-cyan-300">
                HUB
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Gaming & Creator Arcade
            </p>
          </div>
        </div>
      </div>

      {/* Sub-app Navigation: Nebula Hub */}
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            <span>Games & Arcade</span>
            <Sparkles className="size-3 text-cyan-400" />
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            {/* 1. Community Arcade Hub (Always available to all players) */}
            <button
              onClick={() => onSelectSection?.('arcade')}
              className={`w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all text-left ${
                activeSection === 'arcade'
                  ? 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <div
                className={`flex size-7 items-center justify-center rounded-lg ${
                  activeSection === 'arcade'
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                }`}
              >
                <Gamepad2 className="size-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="leading-tight font-semibold text-white truncate">
                  Community Arcade
                </span>
                <span className="text-[10px] text-purple-300/80">Play & Upload Games</span>
              </div>
              <span className="ml-auto rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-purple-300 border border-purple-500/30">
                ARCADE
              </span>
            </button>

            {/* 2. Official App Games Section */}
            {(showDeepSpace || showSolaris) && (
              <div className="pt-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Official Releases
              </div>
            )}

            {/* Deep Space Sabotage (App-Based Game) */}
            {showDeepSpace && (
              <button
                onClick={() => onSelectSection?.('game')}
                className={`w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all text-left ${
                  activeSection === 'game'
                    ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/25 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-lg ${
                    activeSection === 'game'
                      ? 'bg-cyan-400/20 text-cyan-300'
                      : 'bg-white/5 text-slate-400 group-hover:text-cyan-300'
                  }`}
                >
                  <Rocket className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="leading-tight font-semibold text-white truncate">
                      Deep Space App
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300/70">Social Deduction</span>
                </div>

                {isDeepSpaceHidden && isAdmin ? (
                  <span
                    title="Hidden from regular users (Admin Preview)"
                    className="ml-auto flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300"
                  >
                    <EyeOff className="size-2.5" />
                    <span>HIDDEN</span>
                  </span>
                ) : (
                  activeSection === 'game' && (
                    <span className="ml-auto flex size-2 rounded-full bg-cyan-400 animate-pulse" />
                  )
                )}
              </button>
            )}

            {/* Upcoming Game Teaser (Solaris Deck) */}
            {showSolaris && (
              <div className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-slate-500 opacity-70 bg-white/[0.01] border border-white/[0.03]">
                <div className="flex items-center gap-3 min-w-0">
                  <Compass className="size-4 shrink-0" />
                  <span className="truncate">Solaris Deck</span>
                </div>
                {isSolarisHidden && isAdmin ? (
                  <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400/90">
                    HIDDEN
                  </span>
                ) : (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                    UPCOMING
                  </span>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Admin Quick Launcher */}
        {isAdmin && onOpenAdminManager && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1.5">
              <div className="flex items-center gap-1.5">
                {isRoot ? (
                  <Crown className="size-3.5 text-amber-400 fill-amber-400/30" />
                ) : (
                  <Shield className="size-3.5" />
                )}
                <span>{isRoot ? 'Root Superuser Controls' : 'Admin Controls'}</span>
              </div>
              {isRoot ? (
                <span className="rounded bg-gradient-to-r from-amber-400/25 to-purple-500/25 border border-amber-400/40 px-1.5 py-0.5 text-[8px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-0.5 shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  <Crown className="size-2 text-amber-400 fill-amber-400" />
                  ROOT
                </span>
              ) : (
                <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2.5">
              {isRoot
                ? 'Full superuser privileges: manage game releases, assign roles, and administer platform settings.'
                : 'Manage game release visibility or grant administrator roles.'}
            </p>
            <button
              onClick={onOpenAdminManager}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition active:scale-95"
            >
              {isRoot ? <Crown className="size-3.5" /> : <Settings className="size-3.5" />}
              <span>{isRoot ? 'Open Root Admin Panel' : 'Release Manager'}</span>
            </button>
          </div>
        )}

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
            <span className="text-slate-200">Relay: Active</span>
          </div>
          <Signal className="size-3.5 text-emerald-400" />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Nebula Gaming Hub Relay online. Ping: <span className="font-mono text-cyan-300">18ms</span>.
        </p>
      </div>
    </aside>
  );
}
