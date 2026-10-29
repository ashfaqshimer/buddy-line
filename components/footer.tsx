'use client';

import React from 'react';
import { ShieldCheck, Heart, Terminal, Code2 } from 'lucide-react';
import { GiGameConsole, GiJoystick, GiTrophyCup } from 'react-icons/gi';
import { IoChatbubbles, IoSparkles } from 'react-icons/io5';

interface FooterProps {
  onOpenUpload?: () => void;
  onSelectTab?: (tab: 'catalog' | 'leaderboards' | 'community') => void;
}

export function Footer({ onOpenUpload, onSelectTab }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-[#1a1f27]/90 backdrop-blur-xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute left-1/4 top-0 -translate-y-1/2 w-96 h-32 bg-teal-500/6 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 top-0 -translate-y-1/2 w-96 h-32 bg-teal-400/4 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-600 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.25)]">
                <GiGameConsole className="size-5.5 text-slate-950 font-black" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">BUDDY LINE</span>
                <span className="ml-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                  Arcade Hub
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An open, vibrant community arcade where anyone can upload lightweight HTML5, CSS, and JavaScript games and invite anyone across the globe to play instantly.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[11px] font-medium text-teal-400/90">Arcade Online</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-teal-400" />
                <span className="text-[11px]">Sandboxed Iframe Security</span>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3.5">
              Arcade Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab?.('catalog')}
                  className="text-slate-400 hover:text-teal-300 transition flex items-center gap-1.5"
                >
                  <GiJoystick className="size-3.5 text-teal-400" />
                  <span>Games Catalog</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab?.('leaderboards')}
                  className="text-slate-400 hover:text-teal-300 transition flex items-center gap-1.5"
                >
                  <GiTrophyCup className="size-3.5 text-teal-400" />
                  <span>High Score Podium</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab?.('community')}
                  className="text-slate-400 hover:text-teal-300 transition flex items-center gap-1.5"
                >
                  <IoChatbubbles className="size-3.5 text-teal-400" />
                  <span>Community Lounge</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenUpload}
                  className="text-teal-400 font-semibold hover:text-teal-300 transition flex items-center gap-1"
                >
                  <IoSparkles className="size-3 text-teal-400" />
                  <span>Upload Your Game</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Developer & Creator Tools */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3.5">
              Creator Studio
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Code2 className="size-3.5 text-teal-400" />
                <span>HTML5 / Canvas 2D</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="size-3.5 text-teal-400" />
                <span>Vanilla JS Bundler</span>
              </li>
              <li className="flex items-center gap-1.5">
                <GiTrophyCup className="size-3.5 text-teal-400" />
                <span>Zero Server Dependencies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits Strip */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Buddy Line Community Arcade. Built for players and game creators.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="size-3 text-rose-500 fill-rose-500 inline" />
            <span>for indie web developers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
