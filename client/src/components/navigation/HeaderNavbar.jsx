import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Repeat,
  ShieldCheck,
  Search,
  UserCheck,
  LogOut,
  Settings,
  Clock,
  Menu,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { NotificationBell } from '../../features/notifications/NotificationBell.jsx';
import { ThemeToggleButton2 } from '@/components/ui/skiper-ui/skiper4';

/**
 * Responsive Editorial Header with Animated Mobile Drawer adapted from 21st.dev (efferd/header-3).
 * Pure React 19 JSX styled with ThriftSync sustainable editorial tokens.
 */
export function HeaderNavbar({
  activeHash = '#marketplace',
  setActiveHash,
  user,
  isAuthenticated,
  logout,
  cartCount = 0,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  onOpenCampusSafety,
  onOpenCart,
  onOpenMySwaps,
  onOpenMyRentals,
  onOpenMyOrders,
  onOpenSettings,
  onOpenAdmin,
  onOpenAuth,
  onPostListing,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change or hash change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeHash]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Marketplace', href: '#marketplace' },
    { label: 'Departments', href: '#categories' },
    { label: 'Student Swaps', href: '#swaps', accent: 'rental' },
    { label: 'Eco Impact', href: '#impact' },
  ];

  const handleNavClick = (href) => {
    if (setActiveHash) setActiveHash(href);
    window.location.hash = href;
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Campus Announcement Banner */}
      <div className="bg-sustainability text-white text-xs font-medium py-1.5 px-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 tracking-wide z-50 relative">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-amber-300" />
          <span>Fall Semester Circular Drive: 0% seller commission on student textbook swaps</span>
        </span>
        <button
          type="button"
          onClick={onOpenCampusSafety}
          className="underline font-bold hover:text-white/90 transition inline-flex items-center gap-1 cursor-pointer"
        >
          <ShieldCheck className="size-3.5" />
          <span>Handover Safety Zones</span>
        </button>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-surface/95 dark:bg-[#1E1D1B]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a
            href="#marketplace"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#marketplace');
            }}
            className="flex items-center gap-3 group shrink-0"
          >
            <span className="h-9 w-9 rounded-xl bg-sustainability text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              TS
            </span>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-text">
                Thrift<span className="text-sustainability">Sync</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                Campus Circular
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links with Animated Layout Indicator */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = activeHash === link.href;
              const isRental = link.accent === 'rental';

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`relative py-1 transition-colors ${
                    isActive
                      ? isRental
                        ? 'font-bold text-rental'
                        : 'font-bold text-sustainability'
                      : 'text-text hover:text-sustainability'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                        isRental ? 'bg-rental' : 'bg-sustainability'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}

            <button
              type="button"
              onClick={onOpenCampusSafety}
              className="text-text hover:text-sustainability flex items-center gap-1 font-medium transition cursor-pointer"
              title="Verified campus handover checkpoints & security rules"
            >
              <ShieldCheck className="size-4 text-sustainability" />
              <span>Campus Safety</span>
            </button>
          </nav>

          {/* Right Utility Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <div className="flex items-center justify-center p-1 rounded-full border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-800">
              <ThemeToggleButton2 className="size-8 p-1.5 text-stone-800 dark:text-stone-100" />
            </div>

            {/* Search Bar Toggle */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`p-2 rounded-full border transition cursor-pointer ${
                isSearchOpen
                  ? 'border-sustainability bg-sustainability/10 text-sustainability'
                  : 'border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              aria-label="Toggle search bar"
            >
              <Search className="size-4" />
            </button>

            {/* Campus Notifications Bell */}
            <NotificationBell
              onOpenOrders={onOpenMyOrders}
              onOpenRentals={onOpenMyRentals}
              onOpenSwaps={onOpenMySwaps}
            />

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition cursor-pointer"
              aria-label="Open shopping bag"
              title="Open shopping bag"
            >
              <ShoppingBag className="size-4 text-sustainability" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-sustainability text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Desktop User Shortcuts */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenMySwaps}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-800 hover:border-rental text-xs font-semibold text-text transition"
                  title="My Swaps"
                >
                  <Repeat className="size-3.5 text-rental" />
                  <span>Swaps</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMyRentals}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-800 hover:border-rental text-xs font-semibold text-text transition"
                  title="My Rentals"
                >
                  <Clock className="size-3.5 text-rental" />
                  <span>Rentals</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMyOrders}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-800 hover:border-sustainability text-xs font-semibold text-text transition"
                  title="My Orders"
                >
                  <ShoppingBag className="size-3.5 text-sustainability" />
                  <span>Orders</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-xs font-semibold text-purple-700 dark:text-purple-300 transition"
                    title="Admin Command Console"
                  >
                    <ShieldCheck className="size-3.5 text-purple-600" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition"
                  title="Account Settings"
                  aria-label="Open Account Settings"
                >
                  <Settings className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-600 hover:text-red-600 transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'Sign in to access your student bag, orders, and listings.')}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-sustainability text-xs font-bold text-text hover:text-sustainability transition"
              >
                Sign In
              </button>
            )}

            {/* Primary Action CTA */}
            <button
              type="button"
              onClick={onPostListing}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sustainability text-white font-semibold text-xs shadow-sm hover:bg-sustainability/90 hover:shadow transition-all"
            >
              <Plus className="size-3.5" />
              <span>Post Listing</span>
            </button>

            {/* Mobile Hamburger Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-text transition"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-stone-200 dark:border-stone-800 bg-surface dark:bg-[#1E1D1B] px-4 py-3 overflow-hidden shadow-inner"
            >
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <Search className="size-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search campus inventory by title, course, or keyword (e.g. Economics, TI-84, Jacket)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-text text-xs focus:outline-none placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-2 shrink-0 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Animated Slide-over Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-in Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-surface dark:bg-[#1E1D1B] border-l border-stone-200 dark:border-stone-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-8 rounded-lg bg-sustainability text-white flex items-center justify-center font-bold text-sm">
                      TS
                    </span>
                    <span className="font-extrabold text-base text-text">ThriftSync</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500"
                    aria-label="Close menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Post Listing Mobile Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onPostListing();
                  }}
                  className="w-full py-2.5 rounded-xl bg-sustainability text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Post Listing</span>
                </button>

                {/* Primary Nav Links */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Navigation</span>
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                        activeHash === link.href
                          ? 'bg-sustainability/10 text-sustainability font-bold'
                          : 'text-text hover:bg-stone-200/50 dark:hover:bg-stone-800'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCampusSafety();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-text hover:bg-stone-200/50 dark:hover:bg-stone-800 flex items-center gap-2"
                  >
                    <ShieldCheck className="size-4 text-sustainability" />
                    <span>Campus Safety Zones</span>
                  </button>
                </div>

                {/* User Account Section */}
                <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Account</span>
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 rounded-xl bg-stone-200/60 dark:bg-stone-800 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="size-4 text-sustainability" />
                          <span className="text-xs font-bold text-text truncate max-w-[120px]">{user?.name}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-sustainability text-white text-[9px] font-bold uppercase">
                          {user?.role}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenMySwaps();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-stone-200/50 dark:hover:bg-stone-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Repeat className="size-3.5 text-rental" />
                          <span>My Swaps</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenMyRentals();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-stone-200/50 dark:hover:bg-stone-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="size-3.5 text-rental" />
                          <span>My Rentals</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenMyOrders();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-stone-200/50 dark:hover:bg-stone-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="size-3.5 text-sustainability" />
                          <span>My Orders</span>
                        </span>
                      </button>

                      {user?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                        >
                          <ShieldCheck className="size-3.5 text-purple-600" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-stone-200/50 dark:hover:bg-stone-800 flex items-center gap-2"
                      >
                        <Settings className="size-3.5 text-stone-500" />
                        <span>Account Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 mt-2"
                      >
                        <LogOut className="size-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth('login', 'Sign in to access your student bag, orders, and listings.');
                      }}
                      className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-text hover:border-sustainability text-center block"
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 text-[11px] text-stone-400 text-center">
                <span>ThriftSync Campus Network &copy; 2026</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default HeaderNavbar;
