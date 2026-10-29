'use client';

import React, { useReducer, useState, useEffect } from 'react';
import {
  createInitialGameState,
  gameReducer,
  Message,
  Deduction,
  MatchSettings,
} from '@/lib/game-types';
import { generateBotResponse } from '@/app/actions';
import { getAppGamesAction, toggleAppGameVisibilityAction } from '@/app/game-actions';
import { AppGame } from '@/lib/app-games';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { LobbyView } from '@/components/lobby-view';
import { PlayerHud } from '@/components/player-hud';
import { ChatPanel } from '@/components/chat-panel';
import { DevDrawer } from '@/components/dev-drawer';
import { VotingModal } from '@/components/voting-modal';
import { RevealModal } from '@/components/reveal-modal';
import { ArcadeView } from '@/components/arcade-view';
import { AdminManagerModal } from '@/components/admin-manager-modal';
import { useSession } from '@/lib/auth-client';
import {
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Rocket,
  Gamepad2,
  Loader2,
  Lock,
} from 'lucide-react';

export default function NebulaHubApp() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [devTools, setDevTools] = useState(true);
  const [activeSection, setActiveSection] = useState<'game' | 'arcade'>('game');
  const [appGames, setAppGames] = useState<AppGame[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAppGamesLoaded, setIsAppGamesLoaded] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const { data: session } = useSession();

  // Load app games and admin permissions on mount or when session changes
  useEffect(() => {
    let isMounted = true;
    getAppGamesAction().then((res) => {
      if (!isMounted) return;
      if (res.success && res.games) {
        setAppGames(res.games);
        setIsAdmin(res.isAdmin);

        // If Deep Space is hidden and the user is NOT an admin, default activeSection to 'arcade'
        const deepSpace = res.games.find((g) => g.id === 'deep-space');
        if (deepSpace?.isHidden && !res.isAdmin) {
          setActiveSection('arcade');
        }
      }
      setIsAppGamesLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  const deepSpaceConfig = appGames.find((g) => g.id === 'deep-space');
  const isDeepSpaceHidden = deepSpaceConfig ? deepSpaceConfig.isHidden : false;

  // Toggle visibility of the Deep Space game directly from the in-game admin bar
  const handleToggleDeepSpaceVisibility = async () => {
    if (!isAdmin || isTogglingVisibility) return;
    setIsTogglingVisibility(true);
    const nextHidden = !isDeepSpaceHidden;

    try {
      const res = await toggleAppGameVisibilityAction('deep-space', nextHidden);
      if (res.success && res.game) {
        setAppGames((prev) =>
          prev.map((g) => (g.id === 'deep-space' ? { ...g, isHidden: nextHidden } : g))
        );
      }
    } catch (err) {
      console.error('Failed to toggle Deep Space visibility:', err);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleGameVisibilityChanged = (gameId: string, isHidden: boolean) => {
    setAppGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isHidden } : g))
    );
  };

  // Send message turn loop sequence
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
          appGames={appGames}
          isAdmin={isAdmin}
          onOpenAdminManager={() => setIsAdminModalOpen(true)}
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
            onGameVisibilityChanged={handleGameVisibilityChanged}
            isDeepSpaceHidden={isDeepSpaceHidden}
          />

          {/* Sub-app Body: Community Arcade OR Nebula Hub / Deep Space Sabotage */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {activeSection === 'arcade' ? (
              <ArcadeView />
            ) : isDeepSpaceHidden && !isAdmin ? (
              /* Non-admin view when game is hidden / unreleased */
              <div className="my-16 rounded-3xl border border-white/10 bg-[#0d111d] p-10 text-center max-w-xl mx-auto shadow-2xl animate-in fade-in duration-300">
                <div className="flex size-18 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-3xl mx-auto mb-5 text-cyan-400">
                  <Lock className="size-8 text-cyan-400" />
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-3">
                  <span>UNRELEASED / IN DEVELOPMENT</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Deep Space App
                </h2>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                  This official game is currently undergoing calibration and has been hidden by the
                  developer until its official public release. Explore our Community Arcade in the
                  meantime!
                </p>
                <button
                  onClick={() => setActiveSection('arcade')}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 text-sm font-black text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition transform active:scale-95 shadow-lg shadow-cyan-500/20"
                >
                  <Gamepad2 className="size-4.5" />
                  <span>Go to Community Arcade</span>
                </button>
              </div>
            ) : (
              <>
                {/* Admin Game Release Status Banner */}
                {isAdmin && (
                  <div
                    className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 backdrop-blur-md transition ${
                      isDeepSpaceHidden
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                          isDeepSpaceHidden
                            ? 'border-amber-400/40 bg-amber-400/20 text-amber-300'
                            : 'border-emerald-400/40 bg-emerald-400/20 text-emerald-300'
                        }`}
                      >
                        {isDeepSpaceHidden ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-white">
                            Deep Space App Visibility:
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              isDeepSpaceHidden
                                ? 'bg-amber-400/25 text-amber-300 border border-amber-400/40'
                                : 'bg-emerald-400/25 text-emerald-300 border border-emerald-400/40'
                            }`}
                          >
                            {isDeepSpaceHidden
                              ? '🔒 Hidden (Admin Preview Only)'
                              : '🟢 Released (Publicly Visible)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {isDeepSpaceHidden
                            ? 'This game is hidden from regular players and guests. You are viewing it in Admin Preview mode.'
                            : 'This game is live and visible to all players in the Nebula Gaming Hub.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                      <button
                        onClick={handleToggleDeepSpaceVisibility}
                        disabled={isTogglingVisibility}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition active:scale-95 disabled:opacity-50 ${
                          isDeepSpaceHidden
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/20'
                            : 'border border-amber-400/40 bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
                        }`}
                      >
                        {isTogglingVisibility ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : isDeepSpaceHidden ? (
                          <>
                            <Rocket className="size-3.5" />
                            <span>Release to Players 🚀</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3.5" />
                            <span>Hide Game 🔒</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mission Hero Banner */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-1.5">
                      <Sparkles className="size-3.5" />
                      <span>Official Release • Nebula Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                      <span>Deep Space Sabotage</span>
                      {isDeepSpaceHidden && isAdmin && (
                        <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                          Unreleased
                        </span>
                      )}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400">
                      Unmask the hidden <strong className="text-rose-400">Replicants</strong> before
                      life support and reactor core fail on the ISS Astraeus.
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

      {/* Admin Manager Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
        onGameVisibilityChanged={handleGameVisibilityChanged}
      />
    </div>
  );
}
