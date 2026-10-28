import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  UserCheck,
  Tag,
  DollarSign,
  AlertCircle,
  Star,
} from 'lucide-react';
import {
  fetchUserOrders,
  confirmOrder,
  confirmOrderHandover,
  cancelOrder,
  disputeOrder,
} from './orderService.js';
import { useAuth } from '../authentication/authContext.jsx';
import { formatINR } from '../../utils/currency.js';

export function MyOrdersModal({ isOpen, onClose, onOrderUpdated, onLeaveReview }) {
  const { user } = useAuth();
  const modalRef = useRef(null);

  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'sales'
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Cancellation prompt
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Dispute prompt
  const [disputingOrderId, setDisputingOrderId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      setCancellingOrderId(null);
      setDisputingOrderId(null);
    }
  }, [isOpen]);

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

  const currentUserId = user?._id || user?.id;

  const purchasesList = orders.filter(
    (o) => o.buyer?._id === currentUserId || o.buyer === currentUserId
  );
  const salesList = orders.filter(
    (o) => o.seller?._id === currentUserId || o.seller === currentUserId
  );

  const activeList = activeTab === 'purchases' ? purchasesList : salesList;

  const handleSellerConfirm = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await confirmOrder(orderId);
      await loadOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.message || 'Failed to confirm order');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHandover = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await confirmOrderHandover(orderId, { note: 'Physical exchange verified' });
      await loadOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.message || 'Failed to confirm handover');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSubmit = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await cancelOrder(orderId, cancelReason);
      setCancellingOrderId(null);
      setCancelReason('');
      await loadOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisputeSubmit = async (orderId) => {
    if (!disputeReason || disputeReason.trim().length < 10) {
      alert('Dispute reason must be at least 10 characters');
      return;
    }
    setActionLoadingId(orderId);
    try {
      await disputeOrder(orderId, disputeReason);
      setDisputingOrderId(null);
      setDisputeReason('');
      await loadOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      alert(err.message || 'Failed to submit dispute');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            Awaiting Confirmation
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
            Confirmed (Awaiting Handover)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
            Completed & Handed Over
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400 border border-stone-300">
            Cancelled (Listing Unlocked)
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
            Dispute Under Review
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-orders-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-sustainability/10 text-sustainability flex items-center justify-center font-bold">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <h3 id="my-orders-title" className="text-xl font-black text-text">
                Campus Purchases & Orders
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track your active purchases, peer sales, and bilateral handover verifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            aria-label="Close orders"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'purchases'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <span>My Purchases</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'purchases'
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-text'
              }`}
            >
              {purchasesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'sales'
                ? 'bg-text hover:bg-black dark:bg-stone-200 dark:text-stone-900 text-white shadow-sm'
                : 'bg-background hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <span>My Sales</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'sales'
                  ? 'bg-stone-700 dark:bg-stone-400 text-white dark:text-stone-900'
                  : 'bg-stone-200 dark:bg-stone-700 text-text'
              }`}
            >
              {salesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-text hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Refresh orders"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="size-6 animate-spin mb-2" />
              <span className="text-xs">Loading order history...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="size-10 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {activeTab === 'purchases'
                  ? 'You have not made any purchases yet.'
                  : 'You do not have any incoming item sales yet.'}
              </p>
            </div>
          ) : (
            activeList.map((order) => {
              const otherUser = activeTab === 'purchases' ? order.seller : order.buyer;
              const isBuyer = activeTab === 'purchases';
              const isSeller = activeTab === 'sales';
              const isLoadingThis = actionLoadingId === order._id;

              return (
                <div
                  key={order._id}
                  className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3"
                >
                  {/* Top Bar: Title & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text">
                          {order.listing?.title || 'Campus Item'}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <UserCheck className="size-3 text-sustainability" />
                        {isBuyer ? 'Seller: ' : 'Buyer: '}
                        <strong>{otherUser?.name || 'Campus Student'}</strong>
                        {otherUser?.campus && ` (${otherUser.campus})`}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[11px] text-stone-500 block">Total Amount</span>
                      <span className="font-extrabold text-sm text-text">
                        {formatINR(order.totalPaise || Math.round((order.totalAmount || 0) * 100))}
                      </span>
                    </div>
                  </div>

                  {/* Pickup & Handover Details */}
                  <div className="p-3 rounded-xl bg-surface dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                        <MapPin className="size-3.5 text-sustainability" /> Handover Zone
                      </span>
                      <span className="font-bold text-text">{order.pickupLocation}</span>
                    </div>

                    {order.meetupNotes && (
                      <div className="text-[11px] text-stone-600 dark:text-stone-300 border-t border-stone-200 dark:border-stone-800 pt-1.5">
                        <span className="font-semibold text-stone-500">Meetup Plan:</span> {order.meetupNotes}
                      </div>
                    )}
                  </div>

                  {/* Bilateral Handover Tracker (for PENDING or CONFIRMED state) */}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-300">
                        <span>Bilateral Handover & Payment Verification</span>
                        <span className="text-[10px] text-blue-600">Both must confirm on campus</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1">
                          {order.handover?.buyerConfirmed ? '✅' : '⏳'} Buyer: {order.handover?.buyerConfirmed ? 'Verified & Paid' : 'Pending'}
                        </span>
                        <span className="flex items-center gap-1">
                          {order.handover?.sellerConfirmed ? '✅' : '⏳'} Seller: {order.handover?.sellerConfirmed ? 'Delivered & Received' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Seller Acceptance for PENDING */}
                    {isSeller && order.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleSellerConfirm(order._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
                      >
                        Accept & Confirm Meetup
                      </button>
                    )}

                    {/* Bilateral Handover Confirmation */}
                    {(order.status === 'CONFIRMED' || order.status === 'PENDING') && (
                      <>
                        {isBuyer && !order.handover?.buyerConfirmed && (
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleHandover(order._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
                          >
                            Confirm Item Received & Payment Given
                          </button>
                        )}

                        {isSeller && !order.handover?.sellerConfirmed && (
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleHandover(order._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
                          >
                            Confirm Delivery & Payment Received
                          </button>
                        )}
                      </>
                    )}

                    {/* Review Button for Completed Order */}
                    {order.status === 'COMPLETED' && onLeaveReview && (
                      <button
                        type="button"
                        onClick={() =>
                          onLeaveReview({
                            targetUser: otherUser,
                            listing: order.listing,
                            transactionType: 'PURCHASE',
                            transactionId: order._id,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <Star className="size-3.5 fill-white text-white" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}

                    {/* Cancellation Button */}
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrderId(order._id)}
                        className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-red-600 text-xs transition"
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Dispute Button */}
                    {order.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => setDisputingOrderId(order._id)}
                        className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-rose-600 text-xs transition"
                      >
                        Dispute
                      </button>
                    )}
                  </div>

                  {/* Inline Cancel Reason Box */}
                  {cancellingOrderId === order._id && (
                    <div className="mt-2 p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 space-y-2 text-xs animate-in fade-in">
                      <span className="font-semibold text-text">Reason for Cancellation (Item will revert to active)</span>
                      <input
                        type="text"
                        placeholder="e.g. Schedule mismatch or found alternate book"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 text-xs text-text"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setCancellingOrderId(null)}
                          className="px-2.5 py-1 text-xs"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleCancelSubmit(order._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Dispute Reason Box */}
                  {disputingOrderId === order._id && (
                    <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 space-y-2 text-xs animate-in fade-in">
                      <span className="font-bold text-rose-800 dark:text-rose-300">File Campus Transaction Dispute</span>
                      <textarea
                        rows={2}
                        placeholder="State reason for dispute (min 10 characters)..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 text-xs text-text"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDisputingOrderId(null)}
                          className="px-2.5 py-1 text-xs"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleDisputeSubmit(order._id)}
                          className="px-3 py-1 bg-rose-700 text-white rounded-lg text-xs font-bold"
                        >
                          Submit Dispute
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MyOrdersModal;
