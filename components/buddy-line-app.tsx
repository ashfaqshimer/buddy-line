'use client';

import React, { useState, useEffect } from 'react';
import { Header, NavTabType } from '@/components/header';
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
  const [activeTab, setActiveTab] = useState<NavTabType>('catalog');
  const [totalGamesCount, setTotalGamesCount] = useState<number>(0);
  const { session } = useAuth();

  // Poll for unread messages and incoming friend requests
  useEffect(() => {
    if (!session?.user?.id) {
      setChatNotificationCount(0);
      return;
    }

    const checkNotifications = async () => {
      try {
        const res = await getChatNotificationSummaryAction();
        if (res.success && res.summary) {
          setChatNotificationCount(
            res.summary.totalUnreadMessages + res.summary.incomingRequestsCount
          );
        }
      } catch (err) {
        console.warn('Chat notification check notice:', err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleOpenChat = (targetPlayerIdOrUsername?: string) => {
    if (targetPlayerIdOrUsername) {
      setChatTargetFriendId(targetPlayerIdOrUsername);
    }
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#151920] text-[#e8eaed] flex flex-col selection:bg-teal-400/30 selection:text-white">
      {/* Top Navbar */}
      <Header
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenAdminManager={() => setIsAdminModalOpen(true)}
        onOpenChat={() => handleOpenChat()}
        chatNotificationCount={chatNotificationCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalGamesCount={totalGamesCount}
      />

      {/* Main Arcade Experience */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-8 max-w-7xl w-full mx-auto">
        <ArcadeView
          isUploaderOpen={isUploaderOpen}
          setIsUploaderOpen={setIsUploaderOpen}
          activeNavTab={activeTab}
          onSelectNavTab={setActiveTab}
          onGamesLoaded={setTotalGamesCount}
          onOpenChat={handleOpenChat}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenUpload={() => setIsUploaderOpen(true)}
        onSelectTab={setActiveTab}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenChat={() => handleOpenChat()}
        chatNotificationCount={chatNotificationCount}
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
