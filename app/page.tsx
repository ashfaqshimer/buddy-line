'use client';

import React, { useState } from 'react';
import { Header } from '@/components/header';
import { ArcadeView } from '@/components/arcade-view';
import { AdminManagerModal } from '@/components/admin-manager-modal';
import { useSession } from '@/lib/auth-client';

export default function BuddyLineApp() {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100 flex flex-col selection:bg-cyan-400/30 selection:text-white">
      {/* Top Navbar */}
      <Header
        onUploadClick={() => setIsUploaderOpen(true)}
        onOpenAdminManager={() => setIsAdminModalOpen(true)}
      />

      {/* Main Arcade Homepage */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <ArcadeView
          isUploaderOpen={isUploaderOpen}
          setIsUploaderOpen={setIsUploaderOpen}
        />
      </main>

      {/* Admin Manager Modal */}
      <AdminManagerModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={session?.user}
      />
    </div>
  );
}
