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
  Sparkles,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import {
  getUsersListAction,
  setUserRoleAction,
  createPasswordResetCodeAction,
  UserSummary,
} from '@/app/admin-actions';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    email?: string | null;
    username?: string | null;
  } | null;
}

export function AdminManagerModal({
  isOpen,
  onClose,
}: AdminManagerModalProps) {
  // Users state
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ id: string; isRoot: boolean } | null>(null);

  // Password reset codes (shown once, in the row they were issued for)
  const [resetLoadingId, setResetLoadingId] = useState<string | null>(null);
  const [issuedReset, setIssuedReset] = useState<{
    userId: string;
    code: string;
    expiresAt: string;
  } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

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
        setViewer(res.viewer ?? null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load users.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error loading users.' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setIssuedReset(null);
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
            newRole === 'admin' ? 'an admin' : 'a regular player'
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

  const canResetPassword = (target: UserSummary) => {
    if (!viewer || target.isRoot || target.id === viewer.id) return false;
    if (target.role === 'admin') return viewer.isRoot;
    return true;
  };

  const handleResetPassword = async (targetUser: UserSummary) => {
    const label = targetUser.username || targetUser.name;
    const confirmed = window.confirm(
      `Generate a password reset code for ${label}?\n\nOnly do this after confirming you're talking to the real player. Any earlier code for them stops working.`
    );
    if (!confirmed) return;

    setResetLoadingId(targetUser.id);
    setFeedback(null);
    setIssuedReset(null);
    setCodeCopied(false);

    try {
      const res = await createPasswordResetCodeAction({ targetUserId: targetUser.id });
      if (res.success && res.code && res.expiresAt) {
        setIssuedReset({ userId: targetUser.id, code: res.code, expiresAt: res.expiresAt });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create reset code.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error communicating with server.' });
    } finally {
      setResetLoadingId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still visible to copy by hand
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/[0.08] bg-surface shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[85dvh] pb-[env(safe-area-inset-bottom,0px)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-300">
              <Crown className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>Buddy Line Administration</span>
                <span className="rounded-lg bg-amber-400/12 text-amber-300 border border-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Manage platform users, roles, and administrator access privileges.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'border-teal-500/20 bg-teal-500/8 text-teal-300'
                : 'border-rose-500/20 bg-rose-500/8 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-teal-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* User Roles & Permissions Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search username, name, or email..."
                className="w-full rounded-xl border border-white/[0.08] bg-background py-2 pl-9 pr-3 text-base sm:text-xs text-white placeholder-zinc-500 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-16 text-center text-zinc-400">
              <Loader2 className="size-6 animate-spin mx-auto mb-2 text-teal-400" />
              <span className="text-xs">Loading Buddy Line member directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-background p-8 text-center text-zinc-500 text-xs">
              No registered members found matching &quot;{userSearch}&quot;.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((user) => {
                const isUserAdmin = user.role === 'admin';
                const isUserRoot = user.isRoot;
                const isLoadingThis = userActionLoadingId === user.id;
                const isResettingThis = resetLoadingId === user.id;
                const resetForThis = issuedReset?.userId === user.id ? issuedReset : null;

                return (
                  <div
                    key={user.id}
                    className="rounded-xl border border-white/[0.06] bg-background p-3.5 hover:bg-white/[0.03] transition"
                  >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500/15 to-teal-400/8 border border-teal-400/15 text-xs font-bold text-teal-300">
                        {(user.username || user.name).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {user.username || user.name}
                          </span>
                          {isUserRoot ? (
                            <span className="flex items-center gap-1 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider">
                              <Crown className="size-2.5 text-amber-400 fill-amber-400" />
                              ROOT
                            </span>
                          ) : isUserAdmin ? (
                            <span className="flex items-center gap-1 rounded bg-teal-400/10 text-teal-300 border border-teal-400/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              <ShieldCheck className="size-2.5 text-teal-400" />
                              ADMIN
                            </span>
                          ) : (
                            <span className="rounded bg-white/[0.04] text-zinc-400 px-1.5 py-0.2 text-[9px] font-semibold uppercase">
                              PLAYER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {canResetPassword(user) && (
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={isResettingThis}
                          title="Generate a one-time password reset code"
                          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:opacity-50"
                        >
                          {isResettingThis ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <KeyRound className="size-3" />
                          )}
                          <span>Reset Password</span>
                        </button>
                      )}
                      {isUserRoot ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-1.5">
                          <Crown className="size-3 text-amber-400 fill-amber-400" />
                          <span>Permanent Root</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={isLoadingThis}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                            isUserAdmin
                              ? 'border border-rose-500/20 bg-rose-500/8 text-rose-300 hover:bg-rose-500/15'
                              : 'border border-teal-400/25 bg-teal-400/10 text-teal-300 hover:bg-teal-400 hover:text-zinc-950'
                          }`}
                        >
                          {isLoadingThis ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : isUserAdmin ? (
                            <>
                              <ShieldAlert className="size-3" />
                              <span>Demote to Player</span>
                            </>
                          ) : (
                            <>
                              <Shield className="size-3" />
                              <span>Make Admin</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {resetForThis && (
                    <div className="mt-3 rounded-lg border border-teal-400/20 bg-teal-400/[0.06] p-3 animate-in fade-in duration-150">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-lg font-semibold tracking-[0.2em] text-white select-all">
                          {resetForThis.code}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyCode(resetForThis.code)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition"
                          >
                            {codeCopied ? <Check className="size-3 text-teal-400" /> : <Copy className="size-3" />}
                            <span>{codeCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => setIssuedReset(null)}
                            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white transition"
                            aria-label="Dismiss reset code"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                        Give this code to {user.username || user.name} privately. They enter it under{' '}
                        <span className="text-zinc-200">Sign In → Forgot password?</span> to choose a new
                        password. It works once and expires at{' '}
                        {new Date(resetForThis.expiresAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        . It won&apos;t be shown again.
                      </p>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/[0.06] bg-surface px-6 py-3.5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3 text-teal-400" />
            <span>Buddy Line Platform Security Layer</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
