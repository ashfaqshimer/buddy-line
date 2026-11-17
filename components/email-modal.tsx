'use client';

import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="scrim" onClick={() => !loading && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="panel max-w-md p-6"
      >
        <button onClick={onClose} className="icon-btn absolute right-3 top-3" aria-label="Close">
          <X className="size-5" />
        </button>

        <div className="mb-5 flex items-center gap-3 pr-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Mail className="size-5" />
          </span>
          <div>
            <h3 id="email-modal-title" className="font-display text-lg font-bold text-foreground">
              {isPlaceholder ? 'Link an email' : 'Update your email'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isPlaceholder
                ? 'Add a real email so you can sign in with it.'
                : 'Change the email you sign in with.'}
            </p>
          </div>
        </div>

        {currentEmail && (
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-sunken px-3.5 py-3 text-sm">
            <span className="text-subtle-foreground">Current</span>
            <span className="min-w-0 truncate font-mono text-[13px] text-foreground">{currentEmail}</span>
            {isPlaceholder && <span className="tag tag-admin">Auto-generated</span>}
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="mt-px size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle2 className="mt-px size-4 shrink-0" />
            <span>Email updated.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="new-email">New email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="field pl-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !newEmail.trim()} className="btn btn-primary">
              {loading && <Loader2 className="size-4 animate-spin" />}
              <span>{loading ? 'Saving…' : 'Save email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
