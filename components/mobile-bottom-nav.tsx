'use client';

import React from 'react';
import { Plus, MessageCircle, Gamepad2 } from 'lucide-react';

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
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
    >
      <div className="mx-auto flex max-w-sm items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-primary"
        >
          <Gamepad2 className="size-[22px]" />
          <span className="text-[11px] font-semibold">Arcade</span>
        </button>

        <button
          onClick={onUploadClick}
          className="btn-brand -mt-7 flex size-14 shrink-0 items-center justify-center rounded-2xl text-[#0b0820] ring-4 ring-background transition active:scale-95"
          title="Upload a game"
          aria-label="Upload a game"
        >
          <Plus className="size-6 stroke-[2.75]" />
        </button>

        <button
          onClick={onOpenChat}
          aria-label={`Friends and messages${chatNotificationCount > 0 ? `, ${chatNotificationCount} new` : ''}`}
          className="flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-muted-foreground transition hover:text-foreground"
        >
          <span className="relative">
            <MessageCircle className="size-[22px]" />
            {chatNotificationCount > 0 && (
              <span className="count-badge absolute -right-2.5 -top-1.5 ring-2 ring-background">
                {chatNotificationCount > 9 ? '9+' : chatNotificationCount}
              </span>
            )}
          </span>
          <span className="text-[11px] font-semibold">Friends</span>
        </button>
      </div>
    </nav>
  );
}
