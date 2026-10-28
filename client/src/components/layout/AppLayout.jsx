import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { SubHeader } from './SubHeader';
import { Footer } from './Footer';
import { MobileDrawer } from './MobileDrawer';

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#122620] font-sans antialiased">
      {/* Top Main Navigation Header */}
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Secondary Department / Category Bar */}
      <SubHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-2 sm:px-4 py-4">
        <Outlet />
      </main>

      {/* Multi-tier Sustainable Campus Footer */}
      <Footer />

      {/* Slide-out Mobile Department Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
