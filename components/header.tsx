'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ShieldCheck, LogOut, Crown, Mail, MessageCircle, Smile, Plus } from 'lucide-react';
import { BuddyLineLogo } from './buddy-line-logo';
import { useAuth } from '@/components/auth-provider';
import { AuthModal } from './auth-modal';
import { AdminManagerModal } from './admin-manager-modal';
import { EmailModal } from './email-modal';
import { AvatarModal } from './avatar-modal';
import { UserAvatar } from './user-avatar';
import { checkIsRootUserAction } from '@/app/admin-actions';

interface HeaderProps {
  onUploadClick?: () => void;
  onOpenAdminManager?: () => void;
  onOpenChat?: () => void;
  chatNotificationCount?: number;
}

export function Header({
  onUploadClick,
  onOpenAdminManager,
  onOpenChat,
  chatNotificationCount = 0,
}: HeaderProps) {
  const { session, user, isLoggedIn, isPending, isAdmin: authIsAdmin, isRoot: authIsRoot, signOut, refetch } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
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

  // The floating bar firms up once the page scrolls under it
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the account menu with Escape or a click outside it. (A fixed
  // full-screen overlay won't work here: the bar's backdrop-filter makes it
  // the containing block for fixed children.)
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!profileMenuRef.current?.contains(e.target as Node)) setIsProfileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isProfileMenuOpen]);

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
  const userAvatar = customAvatar || userObj?.image || '👾';
  const currentEmail = customEmail || session?.user?.email;
  const hasPlaceholderEmail = currentEmail?.endsWith('@buddyline.local');

  const closeMenuThen = (fn: () => void) => () => {
    setIsProfileMenuOpen(false);
    fn();
  };

  return (
    <>
      <header
        className={`nav-bar sticky top-0 z-40 pt-[env(safe-area-inset-top,0px)] ${isScrolled ? 'is-scrolled' : ''}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center sm:h-[76px] justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex shrink-0 items-center gap-3 rounded-full py-1 pr-2 text-left"
            title="Buddy Line home"
          >
            <BuddyLineLogo size="md" className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
            <span className="font-display text-[17px] font-bold leading-none tracking-tight text-foreground sm:text-xl">
              Buddy Line
            </span>
          </button>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {onUploadClick && isLoggedIn && (
              <button onClick={onUploadClick} className="btn btn-brand hidden md:inline-flex">
                <Plus className="size-[18px] stroke-[2.5]" />
                <span>Upload game</span>
              </button>
            )}

            {isLoggedIn && onOpenChat && (
              <button
                onClick={onOpenChat}
                title="Friends and messages"
                aria-label={`Friends and messages${chatNotificationCount > 0 ? `, ${chatNotificationCount} new` : ''}`}
                className="icon-btn relative hidden size-10 md:inline-flex"
              >
                <MessageCircle className="size-5" />
                {chatNotificationCount > 0 && (
                  <span className="count-badge absolute -right-0.5 -top-0.5 ring-2 ring-background">
                    {chatNotificationCount > 9 ? '9+' : chatNotificationCount}
                  </span>
                )}
              </button>
            )}

            {isPending ? (
              <div className="flex items-center gap-2 p-1 animate-pulse" aria-label="Loading account">
                <div className="size-10 rounded-full bg-surface-raised" />
              </div>
            ) : isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex min-h-[44px] items-center gap-2 rounded-full border border-transparent p-1 transition hover:border-border hover:bg-white/[0.04] sm:pr-3"
                  aria-label="Account menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="relative shrink-0">
                    <UserAvatar
                      avatar={userAvatar}
                      name={userDisplayName}
                      className="size-10 rounded-full bg-surface-raised text-xl font-semibold text-foreground ring-2 ring-social/40"
                    />
                    {effectiveIsRoot && (
                      <span
                        title="Root superuser"
                        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-admin text-background"
                      >
                        <Crown className="size-2" />
                      </span>
                    )}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-[15px] font-semibold text-foreground sm:block">
                    {userDisplayName}
                  </span>
                  <ChevronDown
                    className={`hidden size-4 shrink-0 text-subtle-foreground transition-transform sm:block ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <>
                    <div role="menu" className="menu absolute right-0 z-50 mt-3 w-64 max-w-[calc(100vw-1.5rem)]">
                      <div className="mb-1 flex items-center gap-3 border-b border-border px-3 pb-3 pt-2">
                        <UserAvatar
                          avatar={userAvatar}
                          name={userDisplayName}
                          className="size-10 rounded-full bg-surface text-xl font-semibold text-foreground"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-foreground">{userDisplayName}</span>
                            {isAdmin && <span className="tag tag-admin">{effectiveIsRoot ? 'Root' : 'Admin'}</span>}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-subtle-foreground">
                            {hasPlaceholderEmail ? 'No email linked' : currentEmail || 'Buddy Line member'}
                          </div>
                        </div>
                      </div>

                      <button role="menuitem" onClick={closeMenuThen(() => setIsAvatarModalOpen(true))} className="menu-item">
                        <Smile className="size-4 shrink-0" />
                        <span>Change avatar</span>
                      </button>

                      <button
                        role="menuitem"
                        onClick={closeMenuThen(() => onOpenChat?.())}
                        className="menu-item justify-between"
                      >
                        <span className="flex items-center gap-2.5">
                          <MessageCircle className="size-4 shrink-0" />
                          <span>Friends and messages</span>
                        </span>
                        {chatNotificationCount > 0 && <span className="count-badge">{chatNotificationCount}</span>}
                      </button>

                      <button role="menuitem" onClick={closeMenuThen(() => setIsEmailModalOpen(true))} className="menu-item justify-between">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Mail className="size-4 shrink-0" />
                          <span className="truncate">{hasPlaceholderEmail ? 'Link an email' : 'Update email'}</span>
                        </span>
                        {hasPlaceholderEmail && <span className="tag tag-admin">Recommended</span>}
                      </button>

                      {isAdmin && (
                        <button
                          role="menuitem"
                          onClick={closeMenuThen(() => {
                            if (onOpenAdminManager) onOpenAdminManager();
                            else setIsAdminModalOpen(true);
                          })}
                          className="menu-item text-amber-300 hover:!bg-amber-400/10 hover:!text-amber-200"
                        >
                          <ShieldCheck className="size-4 shrink-0" />
                          <span>Admin console</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-border" />
                      <button role="menuitem" onClick={handleSignOut} className="menu-item hover:!bg-rose-500/10 hover:!text-rose-300">
                        <LogOut className="size-4 shrink-0" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthMode('signin')} className="btn btn-ghost btn-sm sm:h-10 sm:px-[1.125rem] sm:text-sm">
                  Sign in
                </button>
                <button onClick={() => setAuthMode('signup')} className="btn btn-primary btn-sm sm:h-10 sm:px-[1.125rem] sm:text-sm">
                  Join free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        key={authMode ?? 'closed'}
        isOpen={authMode !== null}
        onClose={() => setAuthMode(null)}
        initialMode={authMode ?? 'signup'}
      />

      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
      />

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={userAvatar}
        displayName={userDisplayName}
        onAvatarUpdated={(updated) => {
          setCustomAvatar(updated);
          refetch();
        }}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={currentEmail}
        onEmailUpdated={(updated) => {
          setCustomEmail(updated);
          checkIsRootUserAction().then(setExtraIsRoot);
        }}
      />
    </>
  );
}
