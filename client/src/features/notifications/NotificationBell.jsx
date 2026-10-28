import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Repeat, ShoppingBag, X } from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notificationService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function NotificationBell({ onOpenOrders, onOpenRentals, onOpenSwaps }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef(null);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await fetchNotifications({ limit: 15 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Non-critical background fetch error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    }

    setIsOpen(false);

    if (notif.type.startsWith('ORDER_') && onOpenOrders) {
      onOpenOrders();
    } else if (notif.type.startsWith('RENTAL_') && onOpenRentals) {
      onOpenRentals();
    } else if (notif.type.startsWith('SWAP_') && onOpenSwaps) {
      onOpenSwaps();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const getNotifIcon = (type) => {
    if (type.startsWith('ORDER_')) return ShoppingBag;
    if (type.startsWith('RENTAL_')) return Clock;
    if (type.startsWith('SWAP_')) return Repeat;
    if (type === 'SAFETY_ALERT') return AlertTriangle;
    return ShieldCheck;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Campus notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-full border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-800 hover:border-sustainability text-stone-700 dark:text-stone-300 transition"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-4 bg-rental text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-text">Campus Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rental/10 text-rental dark:text-orange-400 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-sustainability hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-80 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="py-6 text-center text-stone-400 text-xs">
                Checking campus updates...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                <CheckCircle2 className="size-6 mx-auto mb-1.5 text-stone-300 dark:text-stone-700" />
                <p>No new notifications</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Orders, rentals, and safety alerts appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const IconComponent = getNotifIcon(n.type);
                return (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left py-3 px-2 flex items-start gap-3 rounded-xl transition hover:bg-stone-100/60 dark:hover:bg-stone-800/60 ${
                      !n.isRead ? 'bg-sustainability/5 dark:bg-sustainability/10' : ''
                    }`}
                  >
                    <div
                      className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        !n.isRead
                          ? 'bg-sustainability text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      <IconComponent className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-text truncate">{n.title}</span>
                        {!n.isRead && (
                          <span className="size-1.5 rounded-full bg-rental shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-stone-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
