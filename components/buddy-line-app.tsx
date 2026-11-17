'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { ArcadeView } from '@/components/arcade-view';
import { AdminManagerModal } from '@/components/admin-manager-modal';
import { BottomChatWidget } from '@/components/chat/bottom-chat-widget';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { AuthProvider, SessionType, useAuth } from '@/components/auth-provider';
import { getChatNotificationSummaryAction } from '@/app/chat-actions';

interface BuddyLineAppProps {
  initialSession?: SessionType;
  initialIsRoot?: boolean;
}

function BuddyLineAppContent() {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTargetFriendId, setChatTargetFriendId] = useState<string | null>(null);
  const [chatNotificationCount, setChatNotificationCount] = useState<number>(0);
  const { session } = useAuth();

  const userId = session?.user?.id;
  const badgeCount = userId ? chatNotificationCount : 0;

  // Single source of truth for chat badges (header, mobile nav, collapsed chat bar)
  const refreshChatNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getChatNotificationSummaryAction();
      if (res.success && res.summary) {
        setChatNotificationCount(res.summary.totalUnreadMessages + res.summary.incomingRequestsCount);
      }
    } catch (err) {
      console.warn('Chat notification check notice:', err);
    }
  }, [userId]);

  // Poll for unread messages and incoming friend requests (setTimeout chain so requests never overlap)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible') await refreshChatNotifications();
      if (!cancelled) timer = setTimeout(tick, 10000);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId, refreshChatNotifications]);

  const handleOpenChat = (targetPlayerIdOrUsername?: string) => {
    if (targetPlayerIdOrUsername) {
      setChatTargetFriendId(targetPlayerIdOrUsername);
    }
    setIsChatOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      {/* Top Navbar */}
      <Header
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenAdminManager={() => setIsAdminModalOpen(true)}
        onOpenChat={() => handleOpenChat()}
        chatNotificationCount={badgeCount}
      />

      {/* Main Arcade Experience */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <ArcadeView
          isUploaderOpen={isUploaderOpen}
          setIsUploaderOpen={setIsUploaderOpen}
          onOpenChat={handleOpenChat}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenUpload={() => setIsUploaderOpen(true)}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenChat={() => handleOpenChat()}
        chatNotificationCount={badgeCount}
      />

      {/* Admin Manager Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
      />

      {/* Facebook-style Bottom Floating Chat Widget */}
      <BottomChatWidget
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        targetFriendId={chatTargetFriendId}
        onClearTarget={() => setChatTargetFriendId(null)}
        notificationCount={badgeCount}
        onNotificationsChanged={refreshChatNotifications}
      />
    </div>
  );
}

export function BuddyLineApp({ initialSession, initialIsRoot }: BuddyLineAppProps) {
  return (
    <AuthProvider initialSession={initialSession} initialIsRoot={initialIsRoot}>
      <BuddyLineAppContent />
    </AuthProvider>
  );
}
