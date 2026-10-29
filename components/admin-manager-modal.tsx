'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Users,
  Eye,
  EyeOff,
  Rocket,
  Compass,
  Sparkles,
  Info,
} from 'lucide-react';
import { getUsersListAction, setUserRoleAction, UserSummary } from '@/app/admin-actions';
import { getAppGamesAction, toggleAppGameVisibilityAction } from '@/app/game-actions';
import { AppGame } from '@/lib/app-games';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    email?: string | null;
    username?: string | null;
  } | null;
  onGameVisibilityChanged?: (gameId: string, isHidden: boolean) => void;
  initialTab?: 'games' | 'users';
}

export function AdminManagerModal({
  isOpen,
  onClose,
  onGameVisibilityChanged,
  initialTab = 'games',
}: AdminManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'games' | 'users'>(initialTab);

  // Users state
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);

  // App Games state
  const [appGames, setAppGames] = useState<AppGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameActionLoadingId, setGameActionLoadingId] = useState<string | null>(null);

  // Global feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsersListAction();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load users.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error loading users.' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const res = await getAppGamesAction();
      if (res.success && res.games) {
        setAppGames(res.games);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load app games.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error loading games.' });
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      fetchGames();
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleGameVisibility = async (game: AppGame) => {
    const nextHidden = !game.isHidden;
    setGameActionLoadingId(game.id);
    setFeedback(null);

    try {
      const res = await toggleAppGameVisibilityAction(game.id, nextHidden);
      if (res.success && res.game) {
        setAppGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, isHidden: nextHidden } : g))
        );
        onGameVisibilityChanged?.(game.id, nextHidden);
        setFeedback({
          type: 'success',
          message: nextHidden
            ? `🔒 "${game.title}" is now HIDDEN from regular players (Unreleased / Admin Preview).`
            : `🚀 "${game.title}" is now RELEASED and visible to all players on Nebula Hub!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to update game visibility.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error communicating with server.' });
    } finally {
      setGameActionLoadingId(null);
    }
  };

  const handleToggleRole = async (targetUser: UserSummary) => {
    if (targetUser.isRoot) return;
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setUserActionLoadingId(targetUser.id);
    setFeedback(null);

    try {
      const res = await setUserRoleAction({
        targetUserId: targetUser.id,
        newRole,
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        setFeedback({
          type: 'success',
          message: `User ${targetUser.username || targetUser.name} is now ${
            newRole === 'admin' ? 'an Admin 🛡️' : 'a regular Player 👾'
          }!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update user role.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error communicating with server.' });
    } finally {
      setUserActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0d101e] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#090d18] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300">
              <Crown className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Nebula Hub Control Center</span>
                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage app-based game releases and administrator access privileges.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/[0.08] bg-white/[0.02] px-6 pt-2">
          <button
            onClick={() => {
              setActiveTab('games');
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'games'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="size-4" />
            <span>App Games & Release Visibility</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('users');
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'users'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="size-4" />
            <span>User Roles & Permissions</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: App Games Visibility */}
        {activeTab === 'games' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Explanatory banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-xs text-slate-300">
              <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" />
              <p className="leading-relaxed">
                Control which built-in / app-based games are published on Nebula Hub. Hidden games are
                concealed from regular players and guests until you release them, but remain testable
                by Administrators and Platform Owners.
              </p>
            </div>

            {loadingGames ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="size-6 animate-spin mx-auto text-cyan-400 mb-2" />
                <div className="text-xs">Loading app games configuration...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {appGames.map((game) => {
                  const isLoading = gameActionLoadingId === game.id;

                  return (
                    <div
                      key={game.id}
                      className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                        game.isHidden
                          ? 'border-amber-500/30 bg-amber-500/[0.04]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-cyan-400/30'
                      }`}
                    >
                      {/* Game Details */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${
                            game.isHidden
                              ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                              : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                          }`}
                        >
                          {game.icon === 'Rocket' ? (
                            <Rocket className="size-5" />
                          ) : (
                            <Compass className="size-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-white">{game.title}</h3>
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-300">
                              App Game
                            </span>

                            {/* Visibility Badge */}
                            {game.isHidden ? (
                              <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                                <EyeOff className="size-3 text-amber-400" />
                                <span>Hidden / Unreleased</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                                <Eye className="size-3 text-emerald-400" />
                                <span>Released / Public</span>
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                            {game.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 flex items-center justify-end">
                        <button
                          onClick={() => handleToggleGameVisibility(game)}
                          disabled={isLoading}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 ${
                            game.isHidden
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20'
                              : 'border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : game.isHidden ? (
                            <>
                              <Rocket className="size-3.5" />
                              <span>Release to Players</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3.5" />
                              <span>Hide Game</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: User Roles */}
        {activeTab === 'users' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search & Refresh Bar */}
            <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, username, or email..."
                  className="w-full rounded-xl border border-white/10 bg-[#070913] py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                title="Refresh user list"
                className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${loadingUsers ? 'animate-spin text-cyan-400' : ''}`}
                />
              </button>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="size-6 animate-spin mx-auto text-cyan-400 mb-2" />
                  <div className="text-xs">Fetching users from database...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching users found.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isActionLoading = userActionLoadingId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 hover:border-cyan-400/30 hover:bg-white/[0.04] transition"
                    >
                      {/* User info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">{user.name}</span>
                          {user.username && (
                            <span className="text-xs text-cyan-400/90 font-mono">
                              @{user.username}
                            </span>
                          )}

                          {/* Role Pill */}
                          {user.isRoot ? (
                            <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                              <Crown className="size-3 text-amber-400" />
                              <span>Platform Owner</span>
                            </span>
                          ) : user.role === 'admin' ? (
                            <span className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                              <ShieldCheck className="size-3 text-cyan-400" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400 tracking-wider">
                              <span>Player</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 truncate mt-0.5">{user.email}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {user.isRoot ? (
                          <span className="text-[11px] font-semibold text-amber-400/80 px-3 py-1.5 italic">
                            Un-demotable
                          </span>
                        ) : user.role === 'admin' ? (
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <ShieldAlert className="size-3.5" />
                            )}
                            <span>Revoke Admin</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Shield className="size-3.5" />
                            )}
                            <span>Make Admin</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-white/[0.08] bg-[#090d18] px-6 py-3.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Nebula Gaming Hub Live Security Layer</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
