'use client';

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { PRESET_AVATARS } from '@/lib/avatars';
import { BuddyLineLogo } from './buddy-line-logo';
import {
  X,
  Loader2,
  User,
  Lock,
  AlertCircle,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

// Better Auth's default minimum
const MIN_PASSWORD_LENGTH = 8;

// More icons and custom image uploads are available later via "Change Avatar"
const AVATAR_OPTIONS = PRESET_AVATARS.slice(0, 12);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'signup' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin-issued reset code flow
  const [isResetting, setIsResetting] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');

  if (!isOpen) return null;

  const openReset = () => {
    setIsResetting(true);
    setError('');
    setNotice('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeReset = () => {
    setIsResetting(false);
    setError('');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Codes are displayed as XXXX-XXXX; accept any case, spaces or dashes
    const token = resetCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (token.length !== 8) {
      setError('Reset codes are 8 characters, like ABCD-2345.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.resetPassword({ token, newPassword });
      if (res.error) {
        setError(
          res.error.code === 'INVALID_TOKEN'
            ? 'That code is invalid, already used, or expired. Ask an admin for a new one.'
            : res.error.message || 'Could not reset your password. Try again.'
        );
        return;
      }
      setIsResetting(false);
      setMode('signin');
      setPassword('');
      setNotice('Password updated. Sign in with your new password.');
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const cleanIdentifier = username.trim();
    if (!cleanIdentifier) {
      setError(mode === 'signup' ? 'Please choose a username!' : 'Please enter your username or email!');
      return;
    }
    if (mode === 'signup' && cleanIdentifier.length < 3) {
      setError('Username must be at least 3 letters long.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const cleanEmail = email.trim();
        const targetEmail = cleanEmail
          ? cleanEmail.toLowerCase()
          : `${cleanIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@buddyline.local`;

        const res = await authClient.signUp.email({
          email: targetEmail,
          name: cleanIdentifier,
          username: cleanIdentifier,
          password: password,
          image: selectedAvatar,
        });

        if (res.error) {
          setError(res.error.message || 'Could not create account. Try another nickname!');
          setLoading(false);
          return;
        }
      } else {
        const isEmailInput = cleanIdentifier.includes('@');
        const res = isEmailInput
          ? await authClient.signIn.email({
              email: cleanIdentifier.toLowerCase(),
              password: password,
            })
          : await authClient.signIn.username({
              username: cleanIdentifier,
              password: password,
            });

        if (res.error) {
          setError(res.error.message || 'Wrong username or password. Try again!');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again!';
      setError(msg);
      setLoading(false);
    }
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError('');
    setNotice('');
  };

  /** Text input with a leading icon. */
  const iconField = (
    Icon: typeof User,
    props: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
      <input {...props} className={`field pl-10 ${props.className ?? ''}`} />
    </div>
  );

  const submitSpinner = <Loader2 className="size-4 animate-spin" />;

  return (
    <div className="scrim" onClick={() => !loading && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="panel max-h-[92dvh] max-w-md overflow-y-auto p-6 sm:p-7"
      >
        <button onClick={onClose} className="icon-btn absolute right-3 top-3" aria-label="Close">
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          {isResetting ? (
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <KeyRound className="size-6" />
            </span>
          ) : (
            <BuddyLineLogo size="lg" />
          )}
          <h2 id="auth-modal-title" className="font-display mt-4 text-[22px] font-bold text-foreground">
            {isResetting ? 'Reset your password' : mode === 'signup' ? 'Join Buddy Line' : 'Welcome back'}
          </h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            {isResetting
              ? 'Ask a Buddy Line admin for a reset code, then choose a new password.'
              : mode === 'signup'
              ? 'Pick an avatar and a username to play, upload games and chat with friends.'
              : 'Sign in to upload games and chat with your friends.'}
          </p>
        </div>

        {isResetting ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {error && (
              <div className="alert alert-error">
                <AlertCircle className="mt-px size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="reset-code">Reset code</label>
              {iconField(KeyRound, {
                id: 'reset-code',
                type: 'text',
                value: resetCode,
                onChange: (e) => setResetCode(e.target.value),
                placeholder: 'ABCD-2345',
                autoComplete: 'one-time-code',
                autoCapitalize: 'characters',
                spellCheck: false,
                maxLength: 12,
                required: true,
                className: 'font-mono uppercase tracking-widest',
              })}
            </div>

            <div>
              <label className="field-label" htmlFor="reset-new-password">New password</label>
              {iconField(Lock, {
                id: 'reset-new-password',
                type: 'password',
                value: newPassword,
                onChange: (e) => setNewPassword(e.target.value),
                placeholder: `At least ${MIN_PASSWORD_LENGTH} characters`,
                autoComplete: 'new-password',
                required: true,
              })}
            </div>

            <div>
              <label className="field-label" htmlFor="reset-confirm-password">Confirm new password</label>
              {iconField(Lock, {
                id: 'reset-confirm-password',
                type: 'password',
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                placeholder: '••••••••',
                autoComplete: 'new-password',
                required: true,
              })}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg mt-2 w-full">
              {loading ? submitSpinner : <span>Set new password</span>}
            </button>

            <button type="button" onClick={closeReset} className="btn btn-ghost btn-sm mx-auto flex">
              <ArrowLeft className="size-3.5" />
              <span>Back to sign in</span>
            </button>
          </form>
        ) : (
          <>
            <div className="segmented mb-5" role="tablist" aria-label="Account">
              <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')}>
                Create account
              </button>
              <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => switchMode('signin')}>
                Sign in
              </button>
            </div>

            {notice && (
              <div className="alert alert-success mb-4">
                <CheckCircle2 className="mt-px size-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle className="mt-px size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <span className="field-label">Avatar</span>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        aria-label={`Use ${avatar} as avatar`}
                        aria-pressed={selectedAvatar === avatar}
                        className={`flex aspect-square items-center justify-center rounded-2xl text-[22px] transition active:scale-90 ${
                          selectedAvatar === avatar
                            ? 'bg-social/20 ring-2 ring-social'
                            : 'bg-surface-sunken ring-1 ring-border hover:ring-border-strong'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="auth-identifier">
                  {mode === 'signup' ? 'Username' : 'Username or email'}
                </label>
                {iconField(User, {
                  id: 'auth-identifier',
                  type: 'text',
                  value: username,
                  onChange: (e) => setUsername(e.target.value),
                  placeholder: mode === 'signup' ? 'e.g. PixelHero' : 'Your username or email',
                  autoComplete: 'username',
                  maxLength: 40,
                  required: true,
                })}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="field-label flex items-baseline justify-between" htmlFor="auth-email">
                    <span>Email</span>
                    <span className="text-xs font-normal text-subtle-foreground">Optional</span>
                  </label>
                  {iconField(Mail, {
                    id: 'auth-email',
                    type: 'email',
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    placeholder: 'you@example.com',
                    autoComplete: 'email',
                  })}
                  <p className="mt-1.5 text-xs leading-relaxed text-subtle-foreground">
                    Lets you sign in with your email too. You can add one later.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="auth-password">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={openReset}
                      className="text-xs font-semibold text-muted-foreground transition hover:text-primary"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                {iconField(Lock, {
                  id: 'auth-password',
                  type: 'password',
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: '••••••••',
                  autoComplete: mode === 'signup' ? 'new-password' : 'current-password',
                  required: true,
                })}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg mt-2 w-full">
                {loading ? submitSpinner : <span>{mode === 'signup' ? 'Create account' : 'Sign in'}</span>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
