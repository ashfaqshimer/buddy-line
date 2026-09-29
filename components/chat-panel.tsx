'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GameState, Message } from '@/lib/game-types';
import {
  Send,
  MessageSquare,
  Bot,
  User,
  Zap,
  Clock,
  Sparkles,
  Loader2,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

interface ChatPanelProps {
  state: GameState;
  devTools: boolean;
  onSendMessage: (text: string) => void;
}

export function ChatPanel({ state, devTools, onSendMessage }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    turnIndex,
    settings,
    round,
    activeSpeakerId,
    waitingForSpeakerName,
    isProcessingTurn,
  } = state;

  const isUserTurn = activeSpeakerId === 'player-you' && !isProcessingTurn;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, waitingForSpeakerName]);

  const handleSend = () => {
    if (!draft.trim() || !isUserTurn) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1120] shadow-2xl backdrop-blur-md">
      {/* Comms Header: Turn & Phase Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Mission Communications</h3>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                Round {round}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="size-3 text-cyan-400" />
              <span>
                Turn <strong className="text-white font-mono">{turnIndex}</strong> of{' '}
                <strong className="text-white font-mono">{settings.turnLimit}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Turn Status Pill */}
        <div className="flex items-center gap-2">
          {isUserTurn ? (
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Your Turn • Station Comms Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/15 px-3 py-1.5 text-xs font-semibold text-violet-300">
              <Loader2 className="size-3.5 animate-spin text-violet-400" />
              <span>
                Waiting for {waitingForSpeakerName || 'Next Crewmate'}...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {messages.map((m) => {
          const isUser = m.playerId === 'player-you';
          const isSystem = m.playerId === 'system';

          return (
            <div
              key={m.id}
              className={`group flex gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              } ${isSystem ? 'justify-center my-1' : ''}`}
            >
              {/* Speaker Avatar */}
              {!isSystem && (
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-md ${m.playerColor}`}
                >
                  {isUser ? (
                    'CV'
                  ) : m.isBot ? (
                    <Bot className="size-4.5" />
                  ) : (
                    <User className="size-4.5" />
                  )}
                </div>
              )}

              {/* Message Bubble & Metadata */}
              <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
                {!isSystem && (
                  <div className={`mb-1 flex items-center gap-2 text-[11px] text-slate-400 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="font-semibold text-slate-200">{m.playerName}</span>
                    {m.isBot && (
                      <span className="relative group/bot rounded bg-violet-400/15 border border-violet-400/30 px-1.5 py-0.2 text-[9px] font-bold text-violet-300 cursor-help">
                        BOT
                        {/* Dev Tools Hover State: System Prompt */}
                        {devTools && m.systemPrompt && (
                          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-64 rounded-xl border border-violet-400/40 bg-slate-950 p-2.5 text-[10px] text-violet-200 shadow-2xl backdrop-blur-md group-hover/bot:block z-50 text-left">
                            <span className="flex items-center gap-1 font-bold text-violet-300 mb-1">
                              <Terminal className="size-3" /> System Prompt:
                            </span>
                            <span className="italic leading-relaxed">{m.systemPrompt}</span>
                          </span>
                        )}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">{m.timestamp}</span>
                  </div>
                )}

                {/* Bubble Text */}
                <div
                  className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition ${
                    isSystem
                      ? 'border border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-200/90 text-center font-mono text-xs max-w-lg'
                      : isUser
                      ? 'border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                      : 'border border-white/[0.08] bg-white/[0.04] text-slate-200 hover:border-white/[0.15]'
                  }`}
                >
                  {isSystem && (
                    <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      <Zap className="size-3" /> Station Broadcaster
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Bot Thinking / Latency Indicator */}
        {isProcessingTurn && waitingForSpeakerName && (
          <div className="flex items-center gap-3 animate-in fade-in duration-300">
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
              <Bot className="size-4 animate-bounce" />
            </div>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.05] px-4 py-2.5 text-xs text-violet-300 flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              <span>{waitingForSpeakerName} is formulating station telemetry...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Comms Input Form */}
      <div className="border-t border-white/[0.08] bg-white/[0.015] p-4">
        <div
          className={`flex items-center gap-2 rounded-xl border p-2 transition ${
            isUserTurn
              ? 'border-cyan-400/40 bg-black/40 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20'
              : 'border-white/[0.06] bg-black/20 opacity-60'
          }`}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isUserTurn}
            placeholder={
              isUserTurn
                ? 'Share your observations with the crew (Press Enter to transmit)...'
                : `Comms channel restricted. Waiting for ${waitingForSpeakerName || 'others'}...`
            }
            className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none disabled:cursor-not-allowed"
          />

          <button
            onClick={handleSend}
            disabled={!isUserTurn || !draft.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            <Send className="size-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-cyan-400" />
            <span>Turn-locked protocol: Only active player can transmit</span>
          </div>
          <span className="font-mono text-[10px]">
            {settings.turnLimit - turnIndex} turns remaining before Emergency Vote
          </span>
        </div>
      </div>
    </section>
  );
}
