'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  LogOut,
  Sparkles,
  Crown,
  Mail,
  Upload,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { GiGameConsole, GiJoystick, GiTrophyCup } from 'react-icons/gi';
import { IoChatbubbles } from 'react-icons/io5';
import { useSession, signOut } from '@/lib/auth-client';
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
  onUploadClick,
  onOpenAdminManager,
  activeTab = 'catalog',
  onSelectTab,
  totalGamesCount,
}: HeaderProps) {
  const { data: session } = useSession();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  const [customEmail, setCustomEmail] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      checkIsRootUserAction().then(setIsRoot);
    } else {
      setIsRoot(false);
    }
  }, [session?.user]);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
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
  const userDisplayName = userObj?.username || userObj?.name || 'Buddy Gamer';
  const userAvatar = userObj?.image || '👾';
  const isLoggedIn = !!session?.user;

  const handleUpload = () => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
    } else if (onUploadClick) {
      onUploadClick();
    }
  };

  const navItems: {
    id: NavTabType;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'catalog',
      label: 'Arcade',
      shortLabel: 'Arcade',
      icon: <GiJoystick className="size-4 shrink-0 text-teal-400" />,
    },
    {
      id: 'leaderboards',
      label: 'Leaderboards',
      shortLabel: 'Scores',
      icon: <GiTrophyCup className="size-4 shrink-0 text-teal-300" />,
      badge: 'TOP',
    },
    {
      id: 'community',
      label: 'Community Lounge',
      shortLabel: 'Lounge',
      icon: <IoChatbubbles className="size-4 shrink-0 text-teal-300" />,
      badge: 'CHAT',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#1a1f27]/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[4.5rem] flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity + Desktop Nav */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0 shrink-0">
            {/* Logo Brand Button */}
            <button
              onClick={() => onSelectTab?.('catalog')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none shrink-0"
            >
              <div className="relative flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-teal-600 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(45,212,191,0.5)] shrink-0">
                <GiGameConsole className="size-5.5 sm:size-6 text-slate-950" />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-teal-400" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-teal-400 transition-colors whitespace-nowrap">
                    BUDDY LINE
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-teal-400 tracking-wider shrink-0">
                    <Zap className="size-2 text-teal-400 fill-teal-400" />
                    <span>ARCADE</span>
                  </span>
                </div>

                {/* Subtitle hidden on small/medium screens to prevent navbar blowout */}
                <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap">
                  <span>Open Community Games</span>
                  {totalGamesCount !== undefined && totalGamesCount > 0 && (
                    <>
                      <span className="size-1 rounded-full bg-slate-600" />
                      <span className="text-teal-400 font-semibold">{totalGamesCount} playable</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-2 lg:ml-4 pl-2 lg:pl-4 border-l border-white/[0.06] shrink-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab?.(item.id)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-white bg-white/[0.07] shadow-inner'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                          isActive
                            ? 'bg-teal-400/20 text-teal-300 border border-teal-400/30'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Upload CTA Button */}
            <button
              onClick={handleUpload}
              className="relative group overflow-hidden flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 px-4 sm:px-5 py-2 text-xs font-black text-slate-950 shadow-[0_0_18px_rgba(45,212,191,0.25)] hover:shadow-[0_0_26px_rgba(45,212,191,0.45)] transition-all duration-300 transform active:scale-95 whitespace-nowrap shrink-0"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
              <Upload className="size-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span className="hidden sm:inline">Upload Game</span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* Root Superuser Tag (Visible on desktop) */}
            {effectiveIsRoot && (
              <div
                className="hidden 2xl:flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)] whitespace-nowrap shrink-0"
                title="Super Administrator (Root)"
              >
                <Crown className="size-3 text-amber-400 fill-amber-400 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  Root
                </span>
              </div>
            )}

            {/* Admin Panel Button */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (onOpenAdminManager) onOpenAdminManager();
                  else setIsAdminModalOpen(true);
                }}
                title="Open Admin Management Panel"
                className="hidden md:flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/8 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/15 transition shadow-sm whitespace-nowrap shrink-0"
              >
                <Crown className="size-3.5 text-amber-400 shrink-0" />
                <span className="hidden xl:inline text-[11px] font-black uppercase tracking-wider">Admin</span>
              </button>
            )}

            {/* User Profile / Auth Area */}
            <div className="relative border-l border-white/[0.06] pl-2 sm:pl-3 shrink-0">
              {isLoggedIn ? (
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

                    {/* User display details only visible on large desktop */}
                    <div className="hidden xl:block text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs font-bold text-white">
                        <span className="max-w-[85px] truncate">{userDisplayName}</span>
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
                      <div className="text-[10px] text-teal-400/90 font-medium truncate max-w-[95px]">
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
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-teal-400/10 border border-teal-400/25 px-3 py-1.5 text-xs font-black text-teal-400 hover:bg-teal-400 hover:text-slate-950 transition active:scale-95 shadow-sm whitespace-nowrap shrink-0"
                >
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex size-8 sm:size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#1a1f27] px-4 py-3 space-y-2 animate-in fade-in duration-150">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab?.(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === item.id
                    ? 'bg-teal-400/15 text-teal-300 border border-teal-400/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => {
                  if (onOpenAdminManager) onOpenAdminManager();
                  else setIsAdminModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-400/8 border border-amber-400/20"
              >
                <Crown className="size-4 text-amber-400" />
                <span>Open Admin Management Panel</span>
              </button>
            )}
          </div>
        )}
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
          checkIsRootUserAction().then(setIsRoot);
        }}
      />
    </>
  );
}
