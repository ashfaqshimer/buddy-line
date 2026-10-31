'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Move,
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

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-12 right-4 z-40 flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-[#161a22]/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-teal-300 shadow-xl"
        title="Show On-screen Touch Controls"
      >
        <Eye className="size-3.5" />
        <span>Controls</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 pointer-events-none p-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex items-end justify-between select-none"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT: 4-Way D-Pad */}
      <div className="pointer-events-auto flex flex-col items-center bg-black/40 backdrop-blur-md p-2 rounded-3xl border border-white/10 shadow-2xl">
        {/* UP */}
        <button
          onTouchStart={(e) => handlePress('UP', e)}
          onTouchEnd={(e) => handleRelease('UP', e)}
          onMouseDown={(e) => handlePress('UP', e)}
          onMouseUp={(e) => handleRelease('UP', e)}
          className={`size-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
            activeKeys.UP
              ? 'bg-teal-400 text-slate-950 scale-95 shadow-[0_0_12px_#2dd4bf]'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
          aria-label="Up Arrow"
        >
          <ChevronUp className="size-7" />
        </button>

        {/* MIDDLE ROW: LEFT, CENTER, RIGHT */}
        <div className="flex items-center gap-2 my-1">
          {/* LEFT */}
          <button
            onTouchStart={(e) => handlePress('LEFT', e)}
            onTouchEnd={(e) => handleRelease('LEFT', e)}
            onMouseDown={(e) => handlePress('LEFT', e)}
            onMouseUp={(e) => handleRelease('LEFT', e)}
            className={`size-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
              activeKeys.LEFT
                ? 'bg-teal-400 text-slate-950 scale-95 shadow-[0_0_12px_#2dd4bf]'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
            aria-label="Left Arrow"
          >
            <ChevronLeft className="size-7" />
          </button>

          {/* D-Pad Center Core */}
          <div className="size-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <div className="size-2 rounded-full bg-teal-400/40" />
          </div>

          {/* RIGHT */}
          <button
            onTouchStart={(e) => handlePress('RIGHT', e)}
            onTouchEnd={(e) => handleRelease('RIGHT', e)}
            onMouseDown={(e) => handlePress('RIGHT', e)}
            onMouseUp={(e) => handleRelease('RIGHT', e)}
            className={`size-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
              activeKeys.RIGHT
                ? 'bg-teal-400 text-slate-950 scale-95 shadow-[0_0_12px_#2dd4bf]'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
            aria-label="Right Arrow"
          >
            <ChevronRight className="size-7" />
          </button>
        </div>

        {/* DOWN */}
        <button
          onTouchStart={(e) => handlePress('DOWN', e)}
          onTouchEnd={(e) => handleRelease('DOWN', e)}
          onMouseDown={(e) => handlePress('DOWN', e)}
          onMouseUp={(e) => handleRelease('DOWN', e)}
          className={`size-12 rounded-xl flex items-center justify-center transition active:scale-95 ${
            activeKeys.DOWN
              ? 'bg-teal-400 text-slate-950 scale-95 shadow-[0_0_12px_#2dd4bf]'
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
          aria-label="Down Arrow"
        >
          <ChevronDown className="size-7" />
        </button>
      </div>

      {/* RIGHT: Action Buttons (SPACE / A / B) */}
      <div className="pointer-events-auto flex flex-col items-end gap-2 bg-black/40 backdrop-blur-md p-2.5 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between w-full pb-1 px-1 border-b border-white/10">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            ACTIONS
          </span>
          <button
            onClick={onToggleVisibility}
            className="text-slate-400 hover:text-white p-0.5"
            title="Hide On-screen Controls"
          >
            <EyeOff className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* B Button */}
          <button
            onTouchStart={(e) => handlePress('B', e)}
            onTouchEnd={(e) => handleRelease('B', e)}
            onMouseDown={(e) => handlePress('B', e)}
            onMouseUp={(e) => handleRelease('B', e)}
            className={`size-12 rounded-full font-black text-sm flex items-center justify-center transition active:scale-95 shadow-md ${
              activeKeys.B
                ? 'bg-amber-400 text-slate-950 scale-95 shadow-[0_0_12px_#fbbf24]'
                : 'bg-white/10 text-amber-300 border border-amber-400/30 hover:bg-white/15'
            }`}
          >
            B
          </button>

          {/* A Button */}
          <button
            onTouchStart={(e) => handlePress('A', e)}
            onTouchEnd={(e) => handleRelease('A', e)}
            onMouseDown={(e) => handlePress('A', e)}
            onMouseUp={(e) => handleRelease('A', e)}
            className={`size-12 rounded-full font-black text-sm flex items-center justify-center transition active:scale-95 shadow-md ${
              activeKeys.A
                ? 'bg-teal-400 text-slate-950 scale-95 shadow-[0_0_12px_#2dd4bf]'
                : 'bg-white/10 text-teal-300 border border-teal-400/30 hover:bg-white/15'
            }`}
          >
            A
          </button>
        </div>

        {/* Spacebar / Jump Button */}
        <button
          onTouchStart={(e) => handlePress('SPACE', e)}
          onTouchEnd={(e) => handleRelease('SPACE', e)}
          onMouseDown={(e) => handlePress('SPACE', e)}
          onMouseUp={(e) => handleRelease('SPACE', e)}
          className={`w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center transition active:scale-95 shadow-md ${
            activeKeys.SPACE
              ? 'bg-teal-400 text-slate-950 scale-98 shadow-[0_0_14px_#2dd4bf]'
              : 'bg-gradient-to-r from-teal-500/20 to-teal-400/20 text-teal-300 border border-teal-400/40 hover:bg-teal-400/30'
          }`}
        >
          SPACE (ACTION)
        </button>
      </div>
    </div>
  );
}
