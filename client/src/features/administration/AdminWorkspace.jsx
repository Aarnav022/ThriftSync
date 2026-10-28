import React, { useState, useEffect } from 'react';
import {
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
  Truck,
  ArrowLeft,
  Search,
  PackageCheck,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchAdminReports,
  resolveAdminReport,
  fetchAdminListings,
  updateAdminListingStatus,
  fetchAdminUsers,
  updateAdminUserStatus,
  fetchAdminOrders,
  updateAdminOrderFulfillment,
} from './adminService.js';
import { useAuth } from '../authentication/authContext.jsx';
import { formatINR } from '../../utils/currency.js';

export function AdminWorkspace({ onExit }) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reports' | 'listings' | 'users' | 'orders'
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [listings, setListings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fulfillment update modal state
  const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState(null);
  const [fulfillmentForm, setFulfillmentForm] = useState({
    fulfillmentStatus: 'PACKED',
    courierName: '',
    awbNumber: '',
  });

  const isAdmin = isAuthenticated && user?.role === 'admin';

  const loadData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const [m, r, l, u, o] = await Promise.all([
        fetchAdminMetrics().catch(() => null),
        fetchAdminReports({ limit: 50 }).catch(() => ({ reports: [] })),
        fetchAdminListings({ limit: 50 }).catch(() => ({ listings: [] })),
        fetchAdminUsers({ limit: 50 }).catch(() => ({ users: [] })),
        fetchAdminOrders({ limit: 50 }).catch(() => ({ orders: [] })),
      ]);

      setMetrics(m);
      setReports(r.reports || []);
      setListings(l.listings || []);
      setUsersList(u.users || []);
      setOrders(o.orders || []);
    } catch (err) {
      setActionError(err.message || 'Failed to load administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-text flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="size-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Lock className="size-8" />
          </div>
          <h2 className="text-2xl font-black text-text">Access Restricted</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Administrator privileges are strictly required to view the campus command console.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Campus Marketplace</span>
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

  const handleUpdateFulfillment = async (e) => {
    e.preventDefault();
    if (!selectedOrderForFulfillment) return;
    setActionError(null);
    try {
      await updateAdminOrderFulfillment(selectedOrderForFulfillment._id, fulfillmentForm);
      setActionSuccess(`Order #${selectedOrderForFulfillment._id} fulfillment updated to ${fulfillmentForm.fulfillmentStatus}.`);
      setSelectedOrderForFulfillment(null);
      setTimeout(() => setActionSuccess(null), 3000);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update order fulfillment.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans antialiased selection:bg-sustainability selection:text-white transition-colors duration-300">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 dark:bg-[#1E1D1B]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              TS
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-text">ThriftSync Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase">
                  Oversight Console
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block sm:inline">
                Campus Safety, Content Moderation & Order Fulfillment
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition"
              title="Refresh admin data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-surface dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-sustainability text-xs font-bold text-text transition flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span>Campus Store</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action Messages */}
        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-sustainability/10 border border-sustainability/20 text-sustainability dark:text-green-400 text-xs flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 shadow-xs">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-surface dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-text'
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Overview & Metrics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-rental text-white shadow-sm'
                : 'bg-surface dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-text'
            }`}
          >
            <Flag className="size-3.5" />
            <span>Moderation Queue ({reports.filter((r) => r.status === 'pending').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'listings'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-surface dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-text'
            }`}
          >
            <ShoppingBag className="size-3.5" />
            <span>Listings Oversight ({listings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-text text-white dark:bg-stone-200 dark:text-stone-900 shadow-sm'
                : 'bg-surface dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-text'
            }`}
          >
            <Users className="size-3.5" />
            <span>Student Directory ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-surface dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-text'
            }`}
          >
            <Truck className="size-3.5" />
            <span>Orders & Fulfillment ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & METRICS */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Registered Users</span>
                <span className="text-2xl font-black text-text mt-1 block">{metrics.totalUsers}</span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">Campus verified</span>
              </div>
              <div className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Active Listings</span>
                <span className="text-2xl font-black text-sustainability dark:text-green-400 mt-1 block">{metrics.activeListings}</span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">of {metrics.totalListings} total items</span>
              </div>
              <div className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Completed Swaps</span>
                <span className="text-2xl font-black text-rental dark:text-orange-400 mt-1 block">{metrics.completedSwaps}</span>
                <span className="text-[10px] text-stone-500 mt-0.5 block">Zero-waste peer handovers</span>
              </div>
              <div className={`p-4 rounded-2xl border shadow-sm ${
                metrics.pendingReports > 0
                  ? 'bg-rental/10 border-rental/30 text-rental dark:text-orange-400'
                  : 'bg-surface dark:bg-[#1E1D1B] border-stone-200 dark:border-stone-800'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block">Pending Reports</span>
                <span className="text-2xl font-black mt-1 block">{metrics.pendingReports}</span>
                <span className="text-[10px] opacity-80 mt-0.5 block">Requires moderation action</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <PackageCheck className="size-4 text-purple-600" />
                <span>Operational Governance & Health</span>
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                ThriftSync runs with 0% platform commissions on circular student swaps and textbook re-use. All transactions comply with bilateral handover rules, race-safe stock hold verification, and Indian DPDP Act standards.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: MODERATION QUEUE */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800">
                <CheckCircle className="size-10 text-sustainability mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text">Moderation Queue Clear</h4>
                <p className="text-xs text-stone-500 mt-1">There are no reports requiring immediate administrator action.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rental/10 text-rental">
                          {report.reason}
                        </span>
                        <span className="text-xs text-stone-400">Target: {report.targetType}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          report.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text">{report.description || 'No description provided'}</p>
                      <span className="text-[11px] text-stone-400">
                        Reported by: {report.reporter?.name || 'Student'} ({report.reporter?.email || 'N/A'})
                      </span>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolve(report._id, 'SUSPEND_LISTING', 'Suspended by admin')}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs"
                        >
                          Suspend Item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(report._id, 'DISMISS', 'Dismissed by admin')}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-xs font-bold text-text transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LISTINGS OVERSIGHT */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {listings.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 space-x-3">
                      <span>Category: {item.category}</span>
                      <span>Price: {formatINR(item.pricePaise || (item.price ? item.price * 100 : 0))}</span>
                      <span>Seller: {item.seller?.name || 'Student'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleListing(item._id, item.status)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-rental text-xs font-bold text-text transition"
                  >
                    {item.status === 'archived' ? 'Restore to Active' : 'Archive Item'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {usersList.map((u) => (
                <div
                  key={u._id}
                  className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text">{u.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {u.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 space-x-3">
                      <span>Email: {u.email}</span>
                      <span>Campus: {u.campus || 'Main Campus'}</span>
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggleUser(u._id, u.isActive)}
                      className={`self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        u.isActive
                          ? 'border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'border border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      }`}
                    >
                      {u.isActive ? 'Suspend User' : 'Reactivate User'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS & FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800">
                <Truck className="size-10 text-stone-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text">No Orders Found</h4>
                <p className="text-xs text-stone-500 mt-1">Campus marketplace orders will appear here for fulfillment and dispatch.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sustainability">#{order._id.substring(order._id.length - 8)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          Order: {order.orderStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Fulfillment: {order.fulfillmentStatus}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Payment: {order.paymentStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 space-x-3">
                        <span>Buyer: {order.buyer?.name || 'Student'}</span>
                        <span>Total: {formatINR(order.totalPaise || (order.totalAmount ? order.totalAmount * 100 : 0))}</span>
                        {order.tracking?.courierName && (
                          <span>Courier: {order.tracking.courierName} ({order.tracking.awbNumber || 'No AWB'})</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderForFulfillment(order);
                        setFulfillmentForm({
                          fulfillmentStatus: order.fulfillmentStatus || 'PACKED',
                          courierName: order.tracking?.courierName || '',
                          awbNumber: order.tracking?.awbNumber || '',
                        });
                      }}
                      className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Update Fulfillment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fulfillment Update Modal */}
      {selectedOrderForFulfillment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text">Update Order Fulfillment</h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForFulfillment(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFulfillment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Fulfillment Status</label>
                <select
                  value={fulfillmentForm.fulfillmentStatus}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, fulfillmentStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text focus:outline-none"
                >
                  <option value="UNFULFILLED">UNFULFILLED</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="RTO">RTO (Returned to Origin)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Courier Service</label>
                <input
                  type="text"
                  value={fulfillmentForm.courierName}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, courierName: e.target.value })}
                  placeholder="e.g. Blue Dart, Delhivery, Campus Porter"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">AWB / Tracking Number</label>
                <input
                  type="text"
                  value={fulfillmentForm.awbNumber}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, awbNumber: e.target.value })}
                  placeholder="e.g. BD987654321IN"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-background text-text focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Save Tracking & Status
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForFulfillment(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-text hover:bg-stone-200/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWorkspace;
