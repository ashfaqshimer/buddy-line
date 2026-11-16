'use client';

import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { GiJoystick } from 'react-icons/gi';

interface MobileBottomNavProps {
  onUploadClick: () => void;
  onOpenChat: () => void;
  chatNotificationCount?: number;
}

export function MobileBottomNav({
  onUploadClick,
  onOpenChat,
  chatNotificationCount = 0,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.08] bg-[#161a22]/95 backdrop-blur-xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-6px_25px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Arcade (scroll to top) */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all text-teal-300"
        >
          <div className="relative">
            <GiJoystick
              className="size-5 transition-transform scale-110 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
            />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Arcade</span>
        </button>

        {/* Center: Quick Upload Button */}
        <button
          onClick={onUploadClick}
          className="group relative -top-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.4)] active:scale-95 transition-transform shrink-0 border border-teal-200/40"
          title="Upload Your Game"
          aria-label="Upload Your Game"
        >
          <Plus className="size-6 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Friends & Chat */}
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-slate-400 hover:text-teal-300 transition-all relative"
        >
          <div className="relative">
            <MessageSquare className="size-5" />
            {chatNotificationCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-[0_0_6px_rgba(244,63,94,0.7)] animate-pulse">
                {chatNotificationCount > 9 ? '9+' : chatNotificationCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Chat</span>
        </button>
      </div>
    </nav>
  );
}
