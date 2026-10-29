'use client';

import React, { useReducer, useState } from 'react';
import {
  createInitialGameState,
  gameReducer,
  Message,
  Deduction,
  MatchSettings,
} from '@/lib/game-types';
import { generateBotResponse } from '@/app/actions';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { LobbyView } from '@/components/lobby-view';
import { PlayerHud } from '@/components/player-hud';
import { ChatPanel } from '@/components/chat-panel';
import { DevDrawer } from '@/components/dev-drawer';
import { VotingModal } from '@/components/voting-modal';
import { RevealModal } from '@/components/reveal-modal';
import { ArcadeView } from '@/components/arcade-view';
import { useSession } from '@/lib/auth-client';
import { Sparkles, Shield } from 'lucide-react';

export default function NebulaHubApp() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [devTools, setDevTools] = useState(true);
  const [activeSection, setActiveSection] = useState<'game' | 'arcade'>('game');
  const { data: session } = useSession();

  // Send message turn loop sequence (Section 4)
  const handleSendMessage = async (text: string) => {
    if (state.activeSpeakerId !== 'player-you' || state.isProcessingTurn) return;

    // 1. Determine next bot in sequence
    const aliveBots = state.players.filter((p) => p.isBot && p.isAlive);
    if (aliveBots.length === 0) return;

    const nextBotIndex = (state.turnIndex - 1) % aliveBots.length;
    const currentBot = aliveBots[nextBotIndex];

    const userObj = session?.user as { name?: string; username?: string } | undefined;
    const currentUserName = userObj?.username || userObj?.name || 'Commander Vale';

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      playerId: 'player-you',
      playerName: currentUserName,
      playerColor: 'bg-cyan-400 text-slate-950',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Append user message, lock input, set waiting state
    dispatch({
      type: 'USER_SUBMIT_MESSAGE',
      message: userMessage,
      nextSpeaker: currentBot,
    });

    try {
      // 3. Execute Bot Server Action with simulated LLM latency
      const botResponse = await generateBotResponse(
        [...state.messages, userMessage],
        currentBot
      );

      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        playerId: currentBot.id,
        playerName: currentBot.name,
        playerColor: currentBot.color,
        text: botResponse.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: true,
        systemPrompt: currentBot.systemPrompt,
        modelPayload: {
          model: botResponse.model,
          tokens: botResponse.tokens,
          latencyMs: botResponse.latencyMs,
        },
      };

      const newTurnIndex = state.turnIndex + 1;
      const shouldTriggerVoting = newTurnIndex > state.settings.turnLimit;

      // 4. Append bot message, unlock user turn or trigger voting
      dispatch({
        type: 'BOT_FINISH_MESSAGE',
        message: botMessage,
        nextSpeakerId: 'player-you',
        newTurnIndex,
        shouldTriggerVoting,
        apiPayload: {
          model: botResponse.model,
          turn: newTurnIndex,
          tokens: botResponse.tokens,
          latencyMs: botResponse.latencyMs,
          timestamp: new Date().toLocaleTimeString(),
        },
        oxygenDecay: Math.floor(Math.random() * 4) + 2,
        reactorDecay: Math.floor(Math.random() * 4) + 2,
      });
    } catch (err) {
      console.error('Failed to generate bot response:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 flex flex-col selection:bg-cyan-400/30 selection:text-white">
      <div className="flex min-h-screen flex-1">
        {/* Left Global Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
        />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navbar */}
          <Header
            roomCode={state.roomCode}
            devTools={devTools}
            onToggleDevTools={() => setDevTools(!devTools)}
            phase={state.phase}
            activeSection={activeSection}
          />

          {/* Sub-app Body: Community Arcade OR Nebula Hub / Deep Space Sabotage */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {activeSection === 'arcade' ? (
              <ArcadeView />
            ) : (
              <>
                {/* Mission Hero Banner */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Sector Bravo • Sub-App: Nebula Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                      Deep Space Sabotage
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">
                      Unmask the hidden <strong className="text-rose-400">Replicants</strong> before life support and reactor core fail on the ISS Astraeus.
                    </p>
                  </div>

                  {state.phase === 'playing' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2">
                        <Shield className="size-4 text-cyan-400" />
                        <div className="text-xs">
                          <span className="text-slate-400">Status: </span>
                          <span className="font-semibold text-cyan-300">Live Simulation</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Layout Switch Based on State Machine */}
                {state.phase === 'lobby' ? (
                  <LobbyView
                    state={state}
                    onUpdateSettings={(settings: Partial<MatchSettings>) =>
                      dispatch({ type: 'UPDATE_SETTINGS', settings })
                    }
                    onLaunchMission={() => dispatch({ type: 'LAUNCH_MISSION' })}
                  />
                ) : (
                  <div
                    className={`grid gap-6 items-start transition-all duration-300 ${
                      devTools
                        ? 'xl:grid-cols-[280px_minmax(460px,1fr)_340px]'
                        : 'xl:grid-cols-[280px_minmax(460px,1fr)]'
                    }`}
                  >
                    {/* 1. Player HUD (Left) */}
                    <PlayerHud
                      state={state}
                      onToggleRoleReveal={() => dispatch({ type: 'TOGGLE_ROLE_REVEAL' })}
                      onSetDeduction={(playerId: string, deduction: Deduction) =>
                        dispatch({ type: 'SET_DEDUCTION', playerId, deduction })
                      }
                      onSetNote={(playerId: string, note: string) =>
                        dispatch({ type: 'SET_NOTE', playerId, note })
                      }
                    />

                    {/* 2. Comms Chat Panel (Center) */}
                    <ChatPanel
                      state={state}
                      devTools={devTools}
                      onSendMessage={handleSendMessage}
                    />

                    {/* 3. Dev Drawer (Right) */}
                    <DevDrawer state={state} visible={devTools} />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Emergency Voting Modal */}
      {state.phase === 'voting' && (
        <VotingModal
          state={state}
          onSelectEjection={(playerId: string) =>
            dispatch({ type: 'SELECT_EJECTION', playerId })
          }
          onConfirmEjection={() => dispatch({ type: 'CONFIRM_EJECTION' })}
        />
      )}

      {/* Outcome Reveal Modal */}
      {state.phase === 'reveal' && (
        <RevealModal
          state={state}
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
          onResetToLobby={() => dispatch({ type: 'RESET_TO_LOBBY' })}
        />
      )}
    </div>
  );
}
