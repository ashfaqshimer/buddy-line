'use client';

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { X, Sparkles, User, Lock, Rocket, AlertCircle, Mail } from 'lucide-react';

const AVATAR_OPTIONS = ['🚀', '👾', '🕹️', '🐱', '🤖', '🦊', '⚡', '🍕', '🛸', '🦄', '🏆', '⭐'];

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
  const [selectedAvatar, setSelectedAvatar] = useState('🚀');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#1c2028] p-5 sm:p-6 shadow-2xl shadow-black/40 max-h-[90dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-600 text-3xl shadow-lg shadow-teal-500/20 mb-3">
            {mode === 'signup' ? selectedAvatar : '🚀'}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signup' ? 'Join Buddy Line!' : 'Welcome Back, Cadet!'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Pick an avatar and nickname to play & share games'
              : 'Sign in to access your game creations and rank'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-[#151920] p-1 mb-5 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'signup'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              mode === 'signin'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/8 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                Pick Your Mascot Avatar:
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`flex size-11 items-center justify-center rounded-xl text-xl border transition ${
                      selectedAvatar === avatar
                        ? 'border-teal-400 bg-teal-400/15 scale-105 shadow-md shadow-teal-500/20'
                        : 'border-white/[0.06] bg-white/[0.03] hover:border-white/15'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username / Identifier Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {mode === 'signup' ? 'Nickname / Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'signup' ? 'e.g. AstroKid or PixelHero' : 'Enter your nickname or email'}
                maxLength={40}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#151920] py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Optional Email Input (Signup only) */}
          {mode === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Email Address
                </label>
                <span className="text-[10px] text-teal-400/80 font-semibold uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#151920] py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Optional: add an email for account recovery or sign-in. If left blank, a game cadet ID is generated.
              </p>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#151920] py-2.5 pl-10 pr-4 text-base sm:text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin text-lg">⚙️</span>
            ) : mode === 'signup' ? (
              <>
                <Rocket className="size-4" />
                <span>Launch My Account 🚀</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Enter Buddy Line</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
