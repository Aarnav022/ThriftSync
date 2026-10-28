import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  Users,
  ShoppingBag,
  Repeat,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Archive,
  RefreshCw,
  Ban,
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchAdminReports,
  resolveAdminReport,
  fetchAdminListings,
  updateAdminListingStatus,
  fetchAdminUsers,
  updateAdminUserStatus,
} from './adminService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function AdminDashboardModal({ isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const modalRef = useRef(null);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const loadData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const [m, r, l, u] = await Promise.all([
        fetchAdminMetrics().catch(() => null),
        fetchAdminReports({ status: 'PENDING' }).catch(() => ({ reports: [] })),
        fetchAdminListings({ limit: 20 }).catch(() => ({ listings: [] })),
        fetchAdminUsers({ limit: 20 }).catch(() => ({ users: [] })),
      ]);

      setMetrics(m);
      setReports(r.reports || []);
      setListings(l.listings || []);
      setUsersList(u.users || []);
    } catch (err) {
      setActionError(err.message || 'Failed to load administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-center">
          <Lock className="size-10 mx-auto text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-text">Access Denied</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">
            Administrator privileges are required to access the campus moderation console.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-text text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleResolve = async (reportId, action, notes) => {
    setActionError(null);
    try {
      await resolveAdminReport(reportId, {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        action: action === 'SUSPEND_LISTING' ? 'SUSPEND_LISTING' : 'NONE',
        resolutionNotes: notes || `Action taken by ${user.name}`,
      });
      setActionSuccess(`Report ${reportId} resolved.`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update report.');
    }
  };

  const handleToggleListing = async (listingId, currentStatus) => {
    setActionError(null);
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await updateAdminListingStatus(listingId, newStatus);
      setActionSuccess(`Listing updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update listing.');
    }
  };

  const handleToggleUser = async (userId, currentActive) => {
    setActionError(null);
    try {
      await updateAdminUserStatus(userId, !currentActive);
      setActionSuccess(`User account ${!currentActive ? 'activated' : 'suspended'}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update user.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close admin dashboard"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rental/10 border border-rental/20 text-rental dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="size-3.5" />
              <span>Campus Security & Oversight</span>
            </div>
            <h2 id="admin-panel-title" className="text-2xl font-black tracking-tight text-text">
              Platform Administration
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Campus oversight, content moderation queue, and student account safety.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-sustainability text-xs font-bold text-text transition"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Action Messages */}
        {actionSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Metric Overview Cards */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Total Students
              </span>
              <span className="text-xl font-black text-text mt-1 block">
                {metrics.totalUsers}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Active Listings
              </span>
              <span className="text-xl font-black text-sustainability dark:text-green-400 mt-1 block">
                {metrics.activeListings}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Completed Swaps
              </span>
              <span className="text-xl font-black text-text mt-1 block">
                {metrics.completedSwaps}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              metrics.pendingReports > 0
                ? 'bg-rental/10 border-rental/30 text-rental dark:text-orange-400'
                : 'bg-background border-stone-200 dark:border-stone-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                Pending Reports
              </span>
              <span className="text-xl font-black mt-1 block">
                {metrics.pendingReports}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-rental text-white shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            <Flag className="size-3.5" />
            <span>Moderation Queue ({reports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'listings'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            <ShoppingBag className="size-3.5" />
            <span>All Listings ({listings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-text text-white dark:bg-stone-200 dark:text-stone-900 shadow-sm'
                : 'bg-background text-stone-600 dark:text-stone-400 hover:text-text'
            }`}
          >
            <Users className="size-3.5" />
            <span>Student Accounts ({usersList.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[250px] max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              <Loader2 className="size-6 animate-spin mx-auto mb-2 text-sustainability" />
              <span>Loading records...</span>
            </div>
          ) : activeTab === 'reports' ? (
            reports.length === 0 ? (
              <div className="py-16 text-center text-stone-400 text-xs">
                <CheckCircle2 className="size-8 mx-auto mb-2 text-sustainability" />
                <p className="font-bold">Moderation Queue Clear</p>
                <p className="text-[11px] mt-0.5">No pending student reports requiring investigation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-rental/10 text-rental dark:text-orange-400 text-[10px] font-bold uppercase">
                          {r.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-stone-400">Target: {r.targetType}</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 font-medium">
                        {r.description || 'No additional notes provided by reporter.'}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Reported by: {r.reporter?.name || 'Anonymous Student'} • {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolve(r._id, 'SUSPEND_LISTING', 'Archived due to rule violation')}
                        className="px-3 py-1.5 rounded-xl bg-rental text-white text-[11px] font-bold hover:bg-orange-700 transition"
                      >
                        Suspend Item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(r._id, 'DISMISS', 'Report reviewed and dismissed')}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-[11px] font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'listings' ? (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {listings.map((l) => (
                <div key={l._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-text truncate block">{l.title}</span>
                    <span className="text-[11px] text-stone-400">
                      Seller: {l.seller?.name || 'Unknown'} • Status: {l.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleListing(l._id, l.status)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                      l.status === 'archived'
                        ? 'bg-sustainability text-white hover:bg-emerald-800'
                        : 'border border-red-300 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    {l.status === 'archived' ? 'Reactivate' : 'Archive'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {usersList.map((u) => (
                <div key={u._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-text truncate block">{u.name} ({u.email})</span>
                    <span className="text-[11px] text-stone-400">
                      Role: {u.role} • Campus: {u.campus} • Status: {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleUser(u._id, u.isActive)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                      !u.isActive
                        ? 'bg-sustainability text-white hover:bg-emerald-800'
                        : 'border border-red-300 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    {!u.isActive ? 'Reactivate' : 'Suspend'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardModal;
