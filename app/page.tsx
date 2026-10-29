'use client';

import React, { useState } from 'react';
import { Header, NavTabType } from '@/components/header';
import { ArcadeView } from '@/components/arcade-view';
import { AdminManagerModal } from '@/components/admin-manager-modal';
import { Footer } from '@/components/footer';
import { useSession } from '@/lib/auth-client';

export default function BuddyLineApp() {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabType>('catalog');
  const [totalGamesCount, setTotalGamesCount] = useState<number>(0);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-cyan-400/30 selection:text-white">
      {/* Top Navbar */}
      <Header
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenAdminManager={() => setIsAdminModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalGamesCount={totalGamesCount}
      />

      {/* Main Arcade Experience */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <ArcadeView
          isUploaderOpen={isUploaderOpen}
          setIsUploaderOpen={setIsUploaderOpen}
          activeNavTab={activeTab}
          onSelectNavTab={setActiveTab}
          onGamesLoaded={setTotalGamesCount}
        />
      </main>

      {/* Modern Community Footer */}
      <Footer
        onOpenUpload={() => setIsUploaderOpen(true)}
        onSelectTab={setActiveTab}
      />

      {/* Admin Manager Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
      />
    </div>
  );
}
