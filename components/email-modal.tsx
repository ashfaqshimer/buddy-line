'use client';

import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { updateCurrentUserEmailAction } from '@/app/user-actions';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string | null;
  onEmailUpdated?: (newEmail: string) => void;
}

export function EmailModal({
  isOpen,
  onClose,
  currentEmail,
  onEmailUpdated,
}: EmailModalProps) {
  const isPlaceholder = currentEmail?.endsWith('@buddyline.local');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await updateCurrentUserEmailAction(newEmail);
      if (res.success && res.email) {
        setSuccess(true);
        if (onEmailUpdated) onEmailUpdated(res.email);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(res.error || 'Failed to update email.');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#1c2028] p-6 shadow-2xl shadow-black/40">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-400/20 text-teal-400">
            <Mail className="size-5" />
          </div>
          <div>
            <h3 className="font-black text-white text-base">
              {isPlaceholder ? 'Link Your Email Address' : 'Update Email Address'}
            </h3>
            <p className="text-xs text-slate-400">
              {isPlaceholder
                ? 'Replace your placeholder cadet ID with your real email.'
                : 'Manage your connected email account.'}
            </p>
          </div>
        </div>

        {currentEmail && (
          <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#151920] p-3 text-xs">
            <span className="text-slate-400">Current ID: </span>
            <span className="font-mono text-slate-200">{currentEmail}</span>
            {isPlaceholder && (
              <span className="ml-2 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold">
                Auto-Generated
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 p-3 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/8 p-3 text-xs text-teal-300">
            <CheckCircle2 className="size-4 shrink-0 text-teal-400" />
            <span>Email updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              New Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. you@example.com"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#151920] py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
              You can use this email address to sign into your account and receive updates.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newEmail.trim()}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Save Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
