'use client';

import React from 'react';
import { BuddyLineLogo } from './buddy-line-logo';

interface FooterProps {
  onOpenUpload?: () => void;
}

export function Footer({ onOpenUpload }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <BuddyLineLogo size="sm" />
              <span className="display-wide text-lg font-bold leading-none text-foreground">Buddy Line</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              A community arcade for small HTML, CSS and JavaScript games. Upload one and anyone can play it in the browser.
            </p>
            <p className="font-mono text-[11px] text-subtle-foreground">
              Every game runs in a sandboxed iframe.
            </p>
          </div>

          {/* Arcade */}
          <div>
            <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-subtle-foreground">Arcade</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  Browse games
                </button>
              </li>
              <li>
                <button onClick={onOpenUpload} className="text-muted-foreground transition hover:text-foreground">
                  Upload a game
                </button>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-subtle-foreground">For creators</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>HTML5 and Canvas 2D</li>
              <li>Plain JavaScript, no build step</li>
              <li>No server needed</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-subtle-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Buddy Line</span>
          <span>Made for indie web game developers</span>
        </div>
      </div>
    </footer>
  );
}
