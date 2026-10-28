import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
  UserCheck,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  fetchUserRentals,
  decideRental,
  confirmHandoverPickup,
  processReturn,
  cancelRental,
  disputeRental,
} from './rentalService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function MyRentalsModal({ isOpen, onClose, onRentalUpdated, onLeaveReview }) {
  const { user } = useAuth();
  const modalRef = useRef(null);

  const [activeTab, setActiveTab] = useState('borrowed'); // 'borrowed' (renter) or 'lent' (owner)
  const [rentals, setRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Return inspection form state
  const [inspectingRentalId, setInspectingRentalId] = useState(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [depositAction, setDepositAction] = useState('FULL_REFUND');
  const [damageDescription, setDamageDescription] = useState('');
  const [deductionAmount, setDeductionAmount] = useState(0);

  // Cancellation prompt
  const [cancellingRentalId, setCancellingRentalId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Dispute prompt
  const [disputingRentalId, setDisputingRentalId] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const loadRentals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserRentals();
      setRentals(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your rentals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRentals();
      setInspectingRentalId(null);
      setCancellingRentalId(null);
      setDisputingRentalId(null);
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

  const borrowedList = rentals.filter(
    (r) => r.renter?._id === currentUserId || r.renter === currentUserId
  );
  const lentList = rentals.filter(
    (r) => r.owner?._id === currentUserId || r.owner === currentUserId
  );

  const activeList = activeTab === 'borrowed' ? borrowedList : lentList;

  const handleDecision = async (rentalId, decision) => {
    setActionLoadingId(rentalId);
    try {
      await decideRental(rentalId, { decision });
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePickup = async (rentalId) => {
    setActionLoadingId(rentalId);
    try {
      await confirmHandoverPickup(rentalId, { condition: 'Good' });
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Failed to confirm pickup');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleInitiateReturn = async (rentalId) => {
    setActionLoadingId(rentalId);
    try {
      await processReturn(rentalId, { action: 'INITIATE_RETURN' });
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Failed to initiate return');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReturnSettlement = async (rentalId) => {
    setActionLoadingId(rentalId);
    try {
      await processReturn(rentalId, {
        action: 'CONFIRM_RETURN',
        conditionAtReturn: returnCondition,
        depositAction,
        damageDescription,
        deductionAmount: Number(deductionAmount) || 0,
      });
      setInspectingRentalId(null);
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Failed to settle return');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSubmit = async (rentalId) => {
    setActionLoadingId(rentalId);
    try {
      await cancelRental(rentalId, cancelReason);
      setCancellingRentalId(null);
      setCancelReason('');
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Failed to cancel rental');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisputeSubmit = async (rentalId) => {
    if (!disputeReason || disputeReason.trim().length < 10) {
      alert('Dispute reason must be at least 10 characters');
      return;
    }
    setActionLoadingId(rentalId);
    try {
      await disputeRental(rentalId, disputeReason);
      setDisputingRentalId(null);
      setDisputeReason('');
      await loadRentals();
      if (onRentalUpdated) onRentalUpdated();
    } catch (err) {
      alert(err.message || 'Failed to submit dispute');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            Requested
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
            Approved (Awaiting Pickup)
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
            Active Rental
          </span>
        );
      case 'RETURN_PENDING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300">
            Return Inspection Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300">
            Completed & Settled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400 border border-stone-300">
            Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300">
            Declined
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
            Dispute In Review
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
      aria-labelledby="my-rentals-title"
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
            <div className="size-9 rounded-xl bg-rental/10 text-rental flex items-center justify-center font-bold">
              <Clock className="size-5" />
            </div>
            <div>
              <h3 id="my-rentals-title" className="text-xl font-black text-text">
                Campus Rentals Dashboard
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track borrowed and lent gear, bilateral pickup handovers, and deposit refunds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            aria-label="Close rentals"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('borrowed')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'borrowed'
                ? 'bg-rental text-white shadow-sm'
                : 'bg-background hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <span>Borrowed Items</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'borrowed'
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-text'
              }`}
            >
              {borrowedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lent')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'lent'
                ? 'bg-sustainability text-white shadow-sm'
                : 'bg-background hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800'
            }`}
          >
            <span>Lent Items</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'lent'
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-200 dark:bg-stone-700 text-text'
              }`}
            >
              {lentList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={loadRentals}
            disabled={isLoading}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-text hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Refresh list"
            aria-label="Refresh rentals"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="size-6 animate-spin mb-2" />
              <span className="text-xs">Loading rental records...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="size-10 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {activeTab === 'borrowed'
                  ? 'You have not requested or borrowed any items yet.'
                  : 'No students have requested to rent your items yet.'}
              </p>
            </div>
          ) : (
            activeList.map((rental) => {
              const otherUser = activeTab === 'borrowed' ? rental.owner : rental.renter;
              const isOwner = activeTab === 'lent';
              const isRenter = activeTab === 'borrowed';
              const isLoadingThis = actionLoadingId === rental._id;

              return (
                <div
                  key={rental._id}
                  className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3"
                >
                  {/* Top Row: Listing Title & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-text">
                          {rental.listing?.title || 'Campus Item'}
                        </span>
                        {getStatusBadge(rental.status)}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                        <UserCheck className="size-3 text-sustainability" />
                        {isOwner ? 'Rented to: ' : 'Owner: '}
                        <strong>{otherUser?.name || 'Campus Student'}</strong>
                        {otherUser?.campus && ` (${otherUser.campus})`}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[11px] text-stone-500 block">Rental Dates</span>
                      <span className="font-bold text-text">
                        {new Date(rental.startDate).toLocaleDateString()} — {new Date(rental.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Accounting Grid: Rental Fee vs Security Deposit */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-surface dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-semibold block">Rental Fee</span>
                      <span className="font-bold text-rental dark:text-orange-400">
                        ${Number(rental.rentalFee).toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 text-[10px] uppercase font-semibold block">Security Deposit</span>
                      <span className="font-bold text-sustainability dark:text-green-400">
                        ${Number(rental.depositAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-stone-500 text-[10px] uppercase font-semibold block">Deposit Status</span>
                      <span className="font-semibold text-text">
                        {rental.depositStatus === 'HELD' && '🛡️ Held in Escrow'}
                        {rental.depositStatus === 'REFUNDED' && '✅ 100% Refunded'}
                        {rental.depositStatus === 'FORFEITED_PARTIAL' && `⚠️ Refunded $${rental.depositRefundAmount} (Deduction: $${rental.depositDeductionAmount})`}
                        {rental.depositStatus === 'FORFEITED_FULL' && '❌ Retained for Damage'}
                      </span>
                    </div>
                  </div>

                  {/* Damage disclosure if any */}
                  {rental.damageReport?.hasDamage && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                      <strong>Damage Report:</strong> {rental.damageReport.description} (Deduction: ${rental.damageReport.deductionAmount})
                    </div>
                  )}

                  {/* Bilateral Handover Pickup Status (for APPROVED state) */}
                  {rental.status === 'APPROVED' && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-300">
                        <span>Bilateral Handover Pickup</span>
                        <span>Meet at {rental.listing?.pickupLocation || 'Campus Student Center'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="flex items-center gap-1">
                          {rental.handover?.pickupConfirmedByRenter ? '✅' : '⏳'} Renter: {rental.handover?.pickupConfirmedByRenter ? 'Confirmed' : 'Pending'}
                        </span>
                        <span className="flex items-center gap-1">
                          {rental.handover?.pickupConfirmedByOwner ? '✅' : '⏳'} Owner: {rental.handover?.pickupConfirmedByOwner ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Owner Decision on REQUESTED */}
                    {isOwner && rental.status === 'REQUESTED' && (
                      <>
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleDecision(rental._id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition"
                        >
                          Approve Rental
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleDecision(rental._id, 'REJECT')}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {/* Bilateral Pickup Handover Confirmation */}
                    {rental.status === 'APPROVED' && (
                      <>
                        {isRenter && !rental.handover?.pickupConfirmedByRenter && (
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handlePickup(rental._id)}
                            className="px-3 py-1.5 rounded-xl bg-rental text-white font-bold text-xs hover:bg-orange-700 transition"
                          >
                            Confirm Item Received Handover
                          </button>
                        )}
                        {isOwner && !rental.handover?.pickupConfirmedByOwner && (
                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handlePickup(rental._id)}
                            className="px-3 py-1.5 rounded-xl bg-rental text-white font-bold text-xs hover:bg-orange-700 transition"
                          >
                            Confirm Item Handed to Renter
                          </button>
                        )}
                      </>
                    )}

                    {/* Renter Initiates Return */}
                    {isRenter && rental.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleInitiateReturn(rental._id)}
                        className="px-3 py-1.5 rounded-xl bg-rental text-white font-bold text-xs hover:bg-orange-700 transition"
                      >
                        Initiate Return Handover
                      </button>
                    )}

                    {/* Owner Inspects Return Condition & Settles Deposit */}
                    {isOwner && (rental.status === 'RETURN_PENDING' || rental.status === 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={() => setInspectingRentalId(rental._id)}
                        className="px-3 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition"
                      >
                        Inspect Condition & Settle Deposit
                      </button>
                    )}

                    {/* Cancel button if pre-active */}
                    {(rental.status === 'REQUESTED' || rental.status === 'APPROVED') && (
                      <button
                        type="button"
                        onClick={() => setCancellingRentalId(rental._id)}
                        className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-red-600 text-xs transition"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Dispute button */}
                    {(rental.status === 'RETURN_PENDING' || rental.status === 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={() => setDisputingRentalId(rental._id)}
                        className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-rose-600 text-xs transition"
                      >
                        Dispute
                      </button>
                    )}

                    {/* Review Button for Completed Rental */}
                    {rental.status === 'COMPLETED' && onLeaveReview && (
                      <button
                        type="button"
                        onClick={() =>
                          onLeaveReview({
                            targetUser: otherUser,
                            listing: rental.listing,
                            transactionType: 'RENTAL',
                            transactionId: rental._id,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <Star className="size-3.5 fill-white text-white" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}
                  </div>

                  {/* Return Settlement Inspector Form Modal / Inline Box */}
                  {inspectingRentalId === rental._id && (
                    <div className="mt-3 p-4 rounded-2xl bg-surface dark:bg-stone-900 border-2 border-sustainability/50 space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text">Return Condition Inspection & Deposit Settlement</span>
                        <button
                          type="button"
                          onClick={() => setInspectingRentalId(null)}
                          className="text-stone-400 hover:text-text"
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Condition Upon Return
                          </label>
                          <select
                            value={returnCondition}
                            onChange={(e) => setReturnCondition(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 dark:border-stone-700 text-xs"
                          >
                            <option value="Like New">Like New</option>
                            <option value="Good">Good (Normal Wear)</option>
                            <option value="Fair">Fair</option>
                            <option value="Damaged">Damaged</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Deposit Settlement
                          </label>
                          <select
                            value={depositAction}
                            onChange={(e) => setDepositAction(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 dark:border-stone-700 text-xs"
                          >
                            <option value="FULL_REFUND">100% Refund (No Damage)</option>
                            <option value="PARTIAL_REFUND">Partial Deduction (Item Wear)</option>
                            <option value="NO_REFUND">Full Forfeiture (Item Broken/Lost)</option>
                          </select>
                        </div>
                      </div>

                      {depositAction === 'PARTIAL_REFUND' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Deduction Amount (Max ${rental.depositAmount})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={rental.depositAmount}
                            value={deductionAmount}
                            onChange={(e) => setDeductionAmount(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 dark:border-stone-700 text-xs"
                          />
                        </div>
                      )}

                      {(depositAction === 'PARTIAL_REFUND' || depositAction === 'NO_REFUND') && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Itemized Damage Note (Required)
                          </label>
                          <input
                            type="text"
                            placeholder="Describe damage or scratches observed..."
                            value={damageDescription}
                            onChange={(e) => setDamageDescription(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 dark:border-stone-700 text-xs"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setInspectingRentalId(null)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleConfirmReturnSettlement(rental._id)}
                          className="px-4 py-1.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e]"
                        >
                          Confirm Return & Release Deposit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Cancel Reason Box */}
                  {cancellingRentalId === rental._id && (
                    <div className="mt-2 p-3 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 space-y-2 text-xs">
                      <span className="font-semibold text-text">Reason for Cancellation</span>
                      <input
                        type="text"
                        placeholder="e.g. Schedule conflict or no longer needed"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setCancellingRentalId(null)}
                          className="px-2.5 py-1 text-xs"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelSubmit(rental._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                        >
                          Confirm Cancellation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Dispute Reason Box */}
                  {disputingRentalId === rental._id && (
                    <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 space-y-2 text-xs">
                      <span className="font-bold text-rose-800 dark:text-rose-300">Escalate Dispute to Campus Mediation</span>
                      <textarea
                        rows={2}
                        placeholder="State reason for dispute (min 10 characters)..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-stone-300 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDisputingRentalId(null)}
                          className="px-2.5 py-1 text-xs"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisputeSubmit(rental._id)}
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

export default MyRentalsModal;
