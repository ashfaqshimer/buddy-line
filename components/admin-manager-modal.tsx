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
  UserCheck,
  UserX,
} from 'lucide-react';
import { getUsersListAction, setUserRoleAction, UserSummary } from '@/app/admin-actions';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    email?: string | null;
    username?: string | null;
  } | null;
}

export function AdminManagerModal({ isOpen, onClose }: AdminManagerModalProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setFeedback(null);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleRole = async (targetUser: UserSummary) => {
    if (targetUser.isRoot) return;
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setActionLoadingId(targetUser.id);
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
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
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
                <span>Admin & Role Management</span>
                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Root Control
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Assign and revoke Administrator privileges across the community.
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

        {/* Search & Refresh Bar */}
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full rounded-xl border border-white/10 bg-[#070913] py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh user list"
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 transition disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-4 mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium animate-in fade-in duration-150 ${
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

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
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
              const isActionLoading = actionLoadingId === user.id;

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
                        <span className="text-xs text-cyan-400/90 font-mono">@{user.username}</span>
                      )}

                      {/* Role Pill */}
                      {user.isRoot ? (
                        <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                          <Crown className="size-3 text-amber-400" />
                          <span>Root Owner</span>
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
                          <UserX className="size-3.5" />
                        )}
                        <span>Revoke Admin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={isActionLoading}
                        className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition active:scale-95 disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="size-3.5" />
                        )}
                        <span>Make Admin 🛡️</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 bg-[#090d18] px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>{users.length} total community members</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

