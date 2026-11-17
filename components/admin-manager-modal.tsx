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

  const adminCount = users.filter((u) => u.role === 'admin' || u.isRoot).length;

  return (
    <div className="scrim p-3 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="panel flex max-h-[88dvh] max-w-2xl flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-300">
              <Crown className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="admin-modal-title" className="font-display text-lg font-bold text-foreground">Admin console</h2>
              <p className="truncate text-sm text-muted-foreground">Manage roles and help players back into their accounts.</p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close admin console">
            <X className="size-5" />
          </button>
        </div>

        {feedback && (
          <div className={`alert anim-fade mx-5 mt-4 sm:mx-6 ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="mt-px size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-px size-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Members */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by username, name or email"
                aria-label="Search members"
                className="field !rounded-full pl-10"
              />
            </div>
            <button onClick={fetchUsers} disabled={loadingUsers} className="btn btn-secondary shrink-0" title="Refresh list">
              <RefreshCw className={`size-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading members…</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">
              No members match &quot;{userSearch}&quot;.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredUsers.map((user) => {
                const isUserAdmin = user.role === 'admin';
                const isUserRoot = user.isRoot;
                const isLoadingThis = userActionLoadingId === user.id;
                const isResettingThis = resetLoadingId === user.id;
                const resetForThis = issuedReset?.userId === user.id ? issuedReset : null;
                const label = user.username || user.name;

                return (
                  <li key={user.id} className="rounded-2xl border border-border bg-surface-sunken/60 p-3 transition hover:border-border-strong">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-foreground">
                          {label.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">{label}</span>
                            {isUserRoot ? (
                              <span className="tag tag-admin">
                                <Crown className="size-3" />
                                Root
                              </span>
                            ) : isUserAdmin ? (
                              <span className="tag tag-admin">
                                <ShieldCheck className="size-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="tag tag-muted">Player</span>
                            )}
                          </div>
                          <div className="truncate text-xs text-subtle-foreground">{user.email}</div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        {canResetPassword(user) && (
                          <button
                            onClick={() => handleResetPassword(user)}
                            disabled={isResettingThis}
                            title="Generate a one-time password reset code"
                            className="btn btn-secondary btn-sm"
                          >
                            {isResettingThis ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
                            <span>Reset password</span>
                          </button>
                        )}
                        {isUserRoot ? (
                          <span className="px-2 text-xs text-subtle-foreground">Permanent</span>
                        ) : (
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isLoadingThis}
                            className={`btn btn-sm ${isUserAdmin ? 'btn-danger-soft' : 'btn-secondary'}`}
                          >
                            {isLoadingThis ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : isUserAdmin ? (
                              <ShieldAlert className="size-3.5" />
                            ) : (
                              <Shield className="size-3.5" />
                            )}
                            <span>{isLoadingThis ? 'Updating…' : isUserAdmin ? 'Remove admin' : 'Make admin'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {resetForThis && (
                      <div className="anim-fade mt-3 rounded-xl border border-primary/25 bg-primary/[0.06] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="select-all font-mono text-lg font-semibold tracking-[0.2em] text-foreground">
                            {resetForThis.code}
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleCopyCode(resetForThis.code)} className="btn btn-secondary btn-sm">
                              {codeCopied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                              <span>{codeCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button onClick={() => setIssuedReset(null)} className="icon-btn size-8" aria-label="Dismiss reset code">
                              <X className="size-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          Give this code to {label} privately. They enter it under{' '}
                          <span className="text-foreground">Sign in → Forgot password?</span> to choose a new password. It works
                          once and expires at{' '}
                          {new Date(resetForThis.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. It
                          won&apos;t be shown again.
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-subtle-foreground sm:px-6">
          <span className="tabular-nums">
            {loadingUsers ? ' ' : `${users.length} ${users.length === 1 ? 'member' : 'members'} · ${adminCount} ${adminCount === 1 ? 'admin' : 'admins'}`}
          </span>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
