'use client';

import React from 'react';
import { Plus, MessageSquare, LayoutGrid } from 'lucide-react';

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
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-md px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Arcade (scroll to top) */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center min-w-[64px] min-h-[48px] gap-1 rounded-lg text-foreground"
        >
          <LayoutGrid className="size-5" />
          <span className="text-[11px] font-medium">Games</span>
        </button>

        {/* Upload */}
        <button
          onClick={onUploadClick}
          className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition active:scale-95 shrink-0"
          title="Upload a game"
          aria-label="Upload a game"
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* Friends & Chat */}
        <button
          onClick={onOpenChat}
          className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] gap-1 rounded-lg text-muted-foreground transition hover:text-foreground"
        >
          <span className="relative">
            <MessageSquare className="size-5" />
            {chatNotificationCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                {chatNotificationCount > 9 ? '9+' : chatNotificationCount}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium">Chat</span>
        </button>
      </div>
    </nav>
  );
}
