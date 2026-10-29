'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ShieldCheck,
  Orbit,
  LogOut,
  Sparkles,
  Crown,
  Mail,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { AuthModal } from './auth-modal';
import { AdminManagerModal } from './admin-manager-modal';
import { EmailModal } from './email-modal';
import { checkIsRootUserAction } from '@/app/admin-actions';

interface HeaderProps {
  roomCode: string;
  devTools: boolean;
  onToggleDevTools: () => void;
  phase?: string;
  activeSection?: string;
  onGameVisibilityChanged?: (gameId: string, isHidden: boolean) => void;
  isDeepSpaceHidden?: boolean;
}

export function Header({
  roomCode,
  devTools,
  onToggleDevTools,
  activeSection = 'game',
  onGameVisibilityChanged,
  isDeepSpaceHidden = false,
}: HeaderProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const [customEmail, setCustomEmail] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      checkIsRootUserAction().then(setIsRoot);
    } else {
      setIsRoot(false);
    }
  }, [session?.user]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  const userObj = session?.user as { name?: string; username?: string; image?: string | null; role?: string; email?: string } | undefined;
  const isDirectRoot =
    userObj?.role === 'root' ||
    userObj?.username?.toLowerCase() === 'root' ||
    userObj?.email?.toLowerCase() === 'root' ||
    userObj?.email?.toLowerCase() === 'root@buddyline.local' ||
    userObj?.email?.toLowerCase() === 'root@buddyline.com';
  const effectiveIsRoot = isRoot || Boolean(isDirectRoot);
  const userRole = effectiveIsRoot ? 'root' : userObj?.role;
  const isAdmin = effectiveIsRoot || userRole === 'admin';
  const userDisplayName = userObj?.username || userObj?.name || 'Commander Vale';
  const userAvatar = userObj?.image || '🚀';
  const isLoggedIn = !!session?.user;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-white/[0.08] bg-[#0b0f1c]/80 px-4 md:px-8 backdrop-blur-md">
        {/* Breadcrumb & Mission Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline font-medium text-slate-500">Buddy Line</span>
            <span className="hidden sm:inline text-slate-600">/</span>
            <span className="font-semibold text-cyan-300">Nebula Hub</span>
            <span className="text-slate-600">/</span>
            <span className="font-medium text-slate-300">
              {activeSection === 'arcade' ? 'Community Arcade' : 'Deep Space Sabotage'}
            </span>
            {activeSection === 'game' && isDeepSpaceHidden && isAdmin && (
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                Admin Preview
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-300">
            <Orbit className="size-3 animate-spin text-cyan-400" />
            <span>ISS Astraeus</span>
          </div>
        </div>

        {/* Right Controls: Room Code, Dev Tools Toggle, Profile */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Room Code Indicator with copy button */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Room</span>
              <span className="font-mono text-xs md:text-sm font-bold text-cyan-300 tracking-wider">
                {roomCode}
              </span>
            </div>
            <button
              onClick={copyRoomCode}
              title="Copy room invite code"
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          {/* Dev Tools Toggle Switch */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Terminal className={`size-3.5 ${devTools ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline text-xs font-medium text-slate-300">Dev Tools</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={devTools}
              onClick={onToggleDevTools}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                devTools ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  devTools ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Root User Badge */}
          {effectiveIsRoot && (
            <div
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/30 backdrop-blur-sm"
              title="Logged in as Root User (Super Administrator)"
            >
              <div className="flex size-4 items-center justify-center rounded-full bg-amber-400/25 text-amber-300">
                <Crown className="size-3 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
                Root User
              </span>
            </div>
          )}

          {/* Administration Panel Button */}
          {effectiveIsRoot && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              title="Open Admin Panel"
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition shadow-sm"
            >
              <Crown className="size-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">Admin Panel</span>
            </button>
          )}

          {/* User Profile / Auth Area */}
          <div className="relative border-l border-white/10 pl-3 md:pl-5">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 rounded-xl p-1 hover:bg-white/[0.04] transition"
                >
                  <div className="relative">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-base shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                      {userAvatar.length <= 2 ? userAvatar : userDisplayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0b0f1c] bg-emerald-400" />
                    {effectiveIsRoot && (
                      <span
                        title="Root Superuser"
                        className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-[9px] shadow-[0_0_8px_rgba(251,191,36,0.8)] border border-amber-200/50"
                      >
                        👑
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <span className="max-w-[110px] truncate">{userDisplayName}</span>
                      {effectiveIsRoot ? (
                        <span className="rounded-md bg-gradient-to-r from-amber-400/25 to-purple-500/25 text-amber-300 border border-amber-400/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                          <Crown className="size-2.5 text-amber-400 fill-amber-400" />
                          <span>ROOT</span>
                        </span>
                      ) : isAdmin ? (
                        <span className="rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          {userRole}
                        </span>
                      ) : (
                        <ShieldCheck className="size-3 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-cyan-300/80">
                      {effectiveIsRoot ? 'Root Superuser 👑' : isAdmin ? 'Administrator 🛡️' : 'Online Player'}
                    </div>
                  </div>
                  <ChevronDown className="hidden sm:block size-4 text-slate-500" />
                </button>

                {/* Profile dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0e1322] p-1.5 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-white/5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-bold text-white truncate">{userDisplayName}</div>
                        {effectiveIsRoot ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300 bg-gradient-to-r from-amber-400/25 to-purple-500/25 border border-amber-400/40 rounded px-1.5 py-0.5 shadow-[0_0_6px_rgba(251,191,36,0.3)]">
                            <Crown className="size-2.5 text-amber-400 fill-amber-400" />
                            ROOT
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 rounded px-1">
                            {userRole}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {customEmail || session?.user?.email || 'Buddy Line Member'}
                      </div>
                      {effectiveIsRoot && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 rounded-lg px-2 py-1 border border-amber-500/25">
                          <Crown className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span>Root Superuser</span>
                        </div>
                      )}
                    </div>

                    {/* Email management button */}
                    <button
                      onClick={() => {
                        setIsEmailModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full mt-1.5 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] transition text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="size-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          {(customEmail || session?.user?.email)?.endsWith('@buddyline.local')
                            ? 'Link Email Address'
                            : 'Update Email'}
                        </span>
                      </div>
                      {(customEmail || session?.user?.email)?.endsWith('@buddyline.local') && (
                        <span className="rounded bg-amber-400/20 text-amber-300 px-1 py-0.2 text-[9px] font-bold shrink-0">
                          Setup
                        </span>
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsAdminModalOpen(true);
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 transition text-left"
                      >
                        <Crown className="size-3.5 text-amber-400" />
                        <span>Hub & Admin Controls 🛡️</span>
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 transition text-left"
                    >
                      <LogOut className="size-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-cyan-400/15 border border-cyan-400/30 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition active:scale-95 shadow-sm"
              >
                <Sparkles className="size-3.5" />
                <span>Sign In / Join</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal when opened from header */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="signup"
      />

      {/* Root & Admin Management Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
        onGameVisibilityChanged={onGameVisibilityChanged}
      />

      {/* Email Link & Update Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={customEmail || session?.user?.email}
        onEmailUpdated={(updated) => {
          setCustomEmail(updated);
          checkIsRootUserAction().then(setIsRoot);
        }}
      />
    </>
  );
}
