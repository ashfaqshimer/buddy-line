'use client';

import React from 'react';
import { BuddyLineLogo } from './buddy-line-logo';

interface FooterProps {
  onOpenUpload?: () => void;
}

export function Footer({ onOpenUpload }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-border pb-28 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <BuddyLineLogo size="sm" />
          <div>
            <div className="font-display text-sm font-bold text-foreground">Buddy Line</div>
            <p className="mt-0.5 text-xs text-subtle-foreground">
              A community arcade for small web games. Every game runs in a sandboxed frame.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="transition hover:text-foreground"
          >
            Browse games
          </button>
          {onOpenUpload && (
            <button onClick={onOpenUpload} className="transition hover:text-foreground">
              Upload a game
            </button>
          )}
          <span className="text-subtle-foreground">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
