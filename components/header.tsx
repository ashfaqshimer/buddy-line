'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  LogOut,
  Sparkles,
  Crown,
  Mail,
  Zap,
} from 'lucide-react';
import { BuddyLineLogo } from './buddy-line-logo';
import { useAuth } from '@/components/auth-provider';
import { AuthModal } from './auth-modal';
import { AdminManagerModal } from './admin-manager-modal';
import { EmailModal } from './email-modal';
import { checkIsRootUserAction } from '@/app/admin-actions';

export type NavTabType = 'catalog' | 'leaderboards' | 'community';

interface HeaderProps {
  onUploadClick?: () => void;
  onOpenAdminManager?: () => void;
  activeTab?: NavTabType;
  onSelectTab?: (tab: NavTabType) => void;
  totalGamesCount?: number;
}

export function Header({
  onOpenAdminManager,
  onSelectTab,
  totalGamesCount,
}: HeaderProps) {
  const { session, user, isLoggedIn, isPending, isAdmin: authIsAdmin, isRoot: authIsRoot, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [extraIsRoot, setExtraIsRoot] = useState(false);
  const [customEmail, setCustomEmail] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    if (session?.user && !authIsRoot) {
      checkIsRootUserAction().then((res) => {
        if (isSubscribed && res) setExtraIsRoot(true);
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [session?.user, authIsRoot]);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
  };

  const userObj = (user || session?.user) as { name?: string; username?: string; image?: string | null; role?: string; email?: string } | undefined;
  const isDirectRoot =
    userObj?.role === 'root' ||
    userObj?.username?.toLowerCase() === 'root' ||
    userObj?.email?.toLowerCase() === 'root' ||
    userObj?.email?.toLowerCase() === 'root@buddyline.local' ||
    userObj?.email?.toLowerCase() === 'root@buddyline.com';
  const effectiveIsRoot = authIsRoot || extraIsRoot || Boolean(isDirectRoot);
  const userRole = effectiveIsRoot ? 'root' : userObj?.role;
  const isAdmin = authIsAdmin || effectiveIsRoot || userRole === 'admin';
  const userDisplayName = userObj?.username || userObj?.name || 'Buddy Gamer';
  const userAvatar = userObj?.image || '👾';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#1a1f27]/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.5rem] flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <button
            onClick={() => onSelectTab?.('catalog')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none shrink-0"
            title="Buddy Line Arcade - Home"
          >
            <BuddyLineLogo size="md" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Modern Dual-Tone Wordmark */}
                <div className="flex items-baseline font-black tracking-tight text-lg sm:text-xl leading-none">
                  <span className="text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-cyan-200 transition-colors">
                    BUDDY
                  </span>
                  <span className="relative ml-1.5 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 drop-shadow-[0_0_14px_rgba(56,189,248,0.35)] tracking-wide font-black">
                    LINE
                  </span>
                  <span className="inline-block size-1 sm:size-1.5 rounded-full bg-cyan-400 ml-1.5 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                </div>

                {/* High-tech Arcade Pill Badge */}
                <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-cyan-300 tracking-wider shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.12)]">
                  <Zap className="size-2 text-cyan-400 fill-cyan-400" />
                  <span>ARCADE</span>
                </span>
              </div>

              {/* Subtitle & Real-time Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
                <span className="font-medium text-slate-400">Community Web Arcade</span>
                {totalGamesCount !== undefined && totalGamesCount > 0 && (
                  <>
                    <span className="size-1 rounded-full bg-slate-600" />
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                      {totalGamesCount} playable
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Right: User Profile / Auth Area */}
          <div className="relative shrink-0">
            {isPending ? (
              <div className="flex items-center gap-2 rounded-xl p-1 shrink-0 animate-pulse">
                <div className="size-8 sm:size-9 rounded-xl bg-white/[0.06]" />
                <div className="hidden sm:flex flex-col gap-1">
                  <div className="h-3 w-16 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
                </div>
              </div>
            ) : isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-white/[0.06] transition shrink-0"
                >
                  <div className="relative shrink-0">
                    <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-sm shadow-[0_0_12px_rgba(45,212,191,0.2)] font-black text-white">
                      {userAvatar.length <= 2 ? userAvatar : userDisplayName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-[#1a1f27] bg-teal-400" />
                    {effectiveIsRoot && (
                      <span
                        title="Root Superuser"
                        className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-[9px] shadow-[0_0_8px_rgba(251,191,36,0.6)] border border-amber-200/50"
                      >
                        👑
                      </span>
                    )}
                  </div>

                  {/* User display details */}
                  <div className="hidden sm:block text-left whitespace-nowrap">
                    <div className="flex items-center gap-1 text-xs font-bold text-white">
                      <span className="max-w-[100px] truncate">{userDisplayName}</span>
                      {effectiveIsRoot ? (
                        <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 text-[9px] font-black uppercase shrink-0">
                          ROOT
                        </span>
                      ) : isAdmin ? (
                        <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 text-[9px] font-black uppercase shrink-0">
                          ADMIN
                        </span>
                      ) : (
                        <ShieldCheck className="size-3 text-teal-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-teal-400/90 font-medium truncate max-w-[100px]">
                      {effectiveIsRoot ? 'Superuser 👑' : isAdmin ? 'Admin 🛡️' : 'Player 🕹️'}
                    </div>
                  </div>
                  <ChevronDown className="hidden sm:block size-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#1c2028] p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-bold text-white truncate">{userDisplayName}</div>
                        {effectiveIsRoot ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 border border-amber-400/30 rounded px-1.5 py-0.5 shrink-0">
                            <Crown className="size-2.5 text-amber-400 fill-amber-400" />
                            ROOT
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 rounded px-1 shrink-0">
                            {userRole}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {customEmail || session?.user?.email || 'Buddy Line Member'}
                      </div>
                    </div>

                    {/* Email management */}
                    <button
                      onClick={() => {
                        setIsEmailModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full mt-1.5 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] transition text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="size-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">
                          {(customEmail || session?.user?.email)?.endsWith('@buddyline.local')
                            ? 'Link Email Address'
                            : 'Update Email'}
                        </span>
                      </div>
                      {(customEmail || session?.user?.email)?.endsWith('@buddyline.local') && (
                        <span className="rounded bg-amber-400/15 text-amber-300 px-1 py-0.2 text-[9px] font-bold shrink-0">
                          Setup
                        </span>
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (onOpenAdminManager) onOpenAdminManager();
                          else setIsAdminModalOpen(true);
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/8 transition text-left"
                      >
                        <Crown className="size-3.5 text-amber-400 shrink-0" />
                        <span>Admin Console 🛡️</span>
                      </button>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/8 transition text-left"
                    >
                      <LogOut className="size-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-teal-400/10 border border-teal-400/25 px-4 py-2 text-xs font-black text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition active:scale-95 shadow-sm whitespace-nowrap"
              >
                <Sparkles className="size-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="signup"
      />

      {/* Admin Management Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
      />

      {/* Email Link & Update Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={customEmail || session?.user?.email}
        onEmailUpdated={(updated) => {
          setCustomEmail(updated);
          checkIsRootUserAction().then(setExtraIsRoot);
        }}
      />
    </>
  );
}
