'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ShieldCheck, Orbit } from 'lucide-react';

interface HeaderProps {
  roomCode: string;
  devTools: boolean;
  onToggleDevTools: () => void;
  phase: string;
}

export function Header({ roomCode, devTools, onToggleDevTools, phase }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-white/[0.08] bg-[#0b0f1c]/80 px-4 md:px-8 backdrop-blur-md">
      {/* Breadcrumb & Mission Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline font-medium text-slate-500">Buddy Line</span>
          <span className="hidden sm:inline text-slate-600">/</span>
          <span className="font-semibold text-cyan-300">Nebula Hub</span>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-slate-300">Deep Space Sabotage</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-300">
          <Orbit className="size-3 animate-spin text-cyan-400" />
          <span>ISS Astraeus</span>
        </div>
      </div>

      {/* Right Controls: Room Code, Dev Tools Toggle, Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Room Code Indicator with copy button */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Room</span>
            <span className="font-mono text-xs md:text-sm font-bold text-cyan-300 tracking-wider">
              {roomCode}
            </span>
          </div>
          <button
            onClick={copyRoomCode}
            title="Copy room invite code"
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>

        {/* Dev Tools Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Terminal className={`size-3.5 ${devTools ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline text-xs font-medium text-slate-300">Dev Tools</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={devTools}
            onClick={onToggleDevTools}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              devTools ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                devTools ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-3 md:pl-5">
          <div className="relative">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-black text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
              CV
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0b0f1c] bg-emerald-400" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1 text-xs font-semibold text-white">
              <span>Commander Vale</span>
              <ShieldCheck className="size-3 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400">Host • Station Lead</div>
          </div>
          <ChevronDown className="hidden sm:block size-4 text-slate-500" />
        </div>
      </div>
    </header>
  );
}
