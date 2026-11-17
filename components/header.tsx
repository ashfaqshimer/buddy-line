'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  LogOut,
  Crown,
  Mail,
  MessageSquare,
  Smile,
  Upload,
} from 'lucide-react';
import { IoChatbubbles } from 'react-icons/io5';
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
  totalGamesCount?: number;
}

export function Header({
  onUploadClick,
  onOpenAdminManager,
  onOpenChat,
  chatNotificationCount,
  totalGamesCount,
}: HeaderProps) {
  const { session, user, isLoggedIn, isPending, isAdmin: authIsAdmin, isRoot: authIsRoot, signOut, refetch } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Brand */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-left shrink-0 rounded-lg py-1"
            title="Buddy Line home"
          >
            <BuddyLineLogo size="sm" showPing={false} />
            <span className="display-wide text-[17px] sm:text-lg font-bold leading-none text-foreground">Buddy Line</span>
            {totalGamesCount !== undefined && totalGamesCount > 0 && (
              <span className="hidden md:inline font-mono text-[11px] text-subtle-foreground tabular-nums ml-1">
                {totalGamesCount} {totalGamesCount === 1 ? 'game' : 'games'}
              </span>
            )}
          </button>

          {/* Right: Actions + Profile */}
          <div className="relative flex items-center gap-2 shrink-0">
            {onUploadClick && isLoggedIn && (
              <button
                onClick={onUploadClick}
                className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-white/[0.05]"
              >
                <Upload className="size-3.5" />
                <span>Upload</span>
              </button>
            )}
            {isLoggedIn && onOpenChat && (
              <button
                onClick={onOpenChat}
                title="Friends and chat"
                aria-label="Friends and chat"
                className="relative hidden md:flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
              >
                <MessageSquare className="size-4" />
                {(chatNotificationCount ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                    {(chatNotificationCount ?? 0) > 9 ? '9+' : chatNotificationCount}
                  </span>
                )}
              </button>
            )}
            {isPending ? (
              <div className="flex items-center gap-2 p-1 animate-pulse">
                <div className="size-8 rounded-full bg-white/[0.06]" />
                <div className="hidden sm:block h-3 w-20 rounded bg-white/[0.06]" />
              </div>
            ) : isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 sm:pr-2 transition hover:bg-white/[0.05] min-h-[44px] min-w-[44px]"
                  aria-label="Account menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      avatar={userAvatar}
                      name={userDisplayName}
                      className="size-8 rounded-full bg-surface-raised text-sm font-semibold text-foreground"
                    />
                    {effectiveIsRoot && (
                      <span
                        title="Root superuser"
                        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-amber-400 text-background"
                      >
                        <Crown className="size-2" />
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-foreground">{userDisplayName}</span>
                  {isAdmin && (
                    <span className="hidden sm:inline rounded border border-amber-400/30 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-amber-300">
                      {effectiveIsRoot ? 'root' : 'admin'}
                    </span>
                  )}
                  <ChevronDown className="hidden sm:block size-3.5 text-subtle-foreground shrink-0" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-surface p-1.5 shadow-2xl shadow-black/50 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2.5 border-b border-border mb-1">
                      <div className="text-sm font-medium text-foreground truncate">{userDisplayName}</div>
                      <div className="font-mono text-[11px] text-subtle-foreground truncate mt-0.5">
                        {customEmail || session?.user?.email || 'Buddy Line member'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition text-left"
                    >
                      <Smile className="size-4 shrink-0" />
                      <span>Change avatar</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenChat?.();
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <IoChatbubbles className="size-4 shrink-0" />
                        <span>Friends and chat</span>
                      </span>
                      {(chatNotificationCount ?? 0) > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground tabular-nums">
                          {chatNotificationCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setIsEmailModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground transition text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Mail className="size-4 shrink-0" />
                        <span className="truncate">
                          {(customEmail || session?.user?.email)?.endsWith('@buddyline.local')
                            ? 'Link email address'
                            : 'Update email'}
                        </span>
                      </span>
                      {(customEmail || session?.user?.email)?.endsWith('@buddyline.local') && (
                        <span className="rounded border border-amber-400/30 px-1 font-mono text-[10px] text-amber-300 shrink-0">
                          setup
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
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-amber-400/10 transition text-left"
                      >
                        <ShieldCheck className="size-4 shrink-0" />
                        <span>Admin console</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300 transition text-left"
                    >
                      <LogOut className="size-4 shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center rounded-lg bg-foreground px-3.5 py-2 min-h-[40px] text-sm font-semibold text-background transition hover:bg-white active:scale-[0.98] whitespace-nowrap"
              >
                Sign in
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

      {/* Avatar Picker Modal */}
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
