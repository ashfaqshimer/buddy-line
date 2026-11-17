'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface KeyConfig {
  key: string;
  code: string;
  keyCode: number;
}

const KEYS: Record<string, KeyConfig> = {
  UP: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
  DOWN: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
  LEFT: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
  RIGHT: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  SPACE: { key: ' ', code: 'Space', keyCode: 32 },
  A: { key: 'Enter', code: 'Enter', keyCode: 13 },
  B: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
};

interface VirtualGamepadProps {
  onKeyEvent: (action: 'keydown' | 'keyup', key: KeyConfig) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function VirtualGamepad({
  onKeyEvent,
  isVisible,
  onToggleVisibility,
}: VirtualGamepadProps) {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});

  const handlePress = (keyId: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (activeKeys[keyId]) return;
    setActiveKeys((prev) => ({ ...prev, [keyId]: true }));
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    const config = KEYS[keyId];
    if (config) {
      onKeyEvent('keydown', config);
    }
  };

  const handleRelease = (keyId: string, e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!activeKeys[keyId]) return;
    setActiveKeys((prev) => ({ ...prev, [keyId]: false }));
    const config = KEYS[keyId];
    if (config) {
      onKeyEvent('keyup', config);
    }
  };

  /** Touch + mouse handlers for one virtual key. */
  const pressHandlers = (keyId: string) => ({
    onTouchStart: (e: React.TouchEvent) => handlePress(keyId, e),
    onTouchEnd: (e: React.TouchEvent) => handleRelease(keyId, e),
    onMouseDown: (e: React.MouseEvent) => handlePress(keyId, e),
    onMouseUp: (e: React.MouseEvent) => handleRelease(keyId, e),
    onMouseLeave: () => handleRelease(keyId),
  });

  const dpadKey = (keyId: string, label: string, Icon: typeof ChevronUp) => (
    <button
      {...pressHandlers(keyId)}
      aria-label={label}
      className={`flex size-[52px] items-center justify-center rounded-2xl border transition ${
        activeKeys[keyId]
          ? 'scale-95 border-primary bg-primary text-primary-foreground shadow-[0_0_24px_rgba(56,189,248,0.6)]'
          : 'border-white/10 bg-white/[0.08] text-white'
      }`}
    >
      <Icon className="size-7" />
    </button>
  );

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="glass absolute bottom-3 right-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-border-strong px-3.5 py-2 text-xs font-semibold text-foreground shadow-xl"
        title="Show on-screen touch controls"
      >
        <Eye className="size-3.5" />
        <span>Show controls</span>
      </button>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex select-none items-end justify-between p-3 pb-4"
      style={{ touchAction: 'none' }}
    >
      {/* D-pad */}
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1 rounded-[28px] border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-md">
        <span />
        {dpadKey('UP', 'Up arrow', ChevronUp)}
        <span />
        {dpadKey('LEFT', 'Left arrow', ChevronLeft)}
        <span className="flex items-center justify-center" aria-hidden>
          <span className="size-3 rounded-full bg-white/15" />
        </span>
        {dpadKey('RIGHT', 'Right arrow', ChevronRight)}
        <span />
        {dpadKey('DOWN', 'Down arrow', ChevronDown)}
        <span />
      </div>

      {/* Action buttons */}
      <div className="pointer-events-auto flex flex-col items-stretch gap-2.5 rounded-[28px] border border-white/10 bg-black/45 p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Actions</span>
          <button onClick={onToggleVisibility} className="rounded-full p-1 text-white/50 hover:text-white" title="Hide on-screen controls" aria-label="Hide on-screen controls">
            <EyeOff className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            {...pressHandlers('B')}
            aria-label="B (Shift)"
            className={`font-display flex size-14 translate-y-3 items-center justify-center rounded-full border-2 text-base font-bold transition ${
              activeKeys.B
                ? 'scale-95 border-social bg-social text-social-foreground shadow-[0_0_24px_rgba(167,139,250,0.7)]'
                : 'border-social/50 bg-social/15 text-social-hover'
            }`}
          >
            B
          </button>
          <button
            {...pressHandlers('A')}
            aria-label="A (Enter)"
            className={`font-display flex size-14 -translate-y-1 items-center justify-center rounded-full border-2 text-base font-bold transition ${
              activeKeys.A
                ? 'scale-95 border-primary bg-primary text-primary-foreground shadow-[0_0_24px_rgba(56,189,248,0.7)]'
                : 'border-primary/50 bg-primary/15 text-primary-hover'
            }`}
          >
            A
          </button>
        </div>

        <button
          {...pressHandlers('SPACE')}
          aria-label="Space"
          className={`mt-2 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${
            activeKeys.SPACE
              ? 'scale-[0.98] border-white bg-white text-background'
              : 'border-white/20 bg-white/[0.08] text-white'
          }`}
        >
          Space
        </button>
      </div>
    </div>
  );
}
