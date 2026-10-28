import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Repeat,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageSquare,
  Undo2,
  Star,
} from 'lucide-react';
import {
  fetchUserSwaps,
  acceptSwap,
  rejectSwap,
  withdrawSwap,
  cancelSwap,
  confirmHandover,
  counterSwap,
} from './swapService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function MySwapsModal({ isOpen, onClose, onLeaveReview }) {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [activeCounterSwapId, setActiveCounterSwapId] = useState(null);
  const [counterMessage, setCounterMessage] = useState('');
  const modalRef = useRef(null);

  const loadSwaps = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const data = await fetchUserSwaps({ type: activeTab });
      setSwaps(data.swaps || []);
    } catch (err) {
      setServerError('Failed to load swap proposals: ' + (err.message || 'Network error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSwaps();
    }
  }, [isOpen, activeTab]);

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

  const handleAccept = async (swapId) => {
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await acceptSwap(swapId);
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to accept proposal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (swapId) => {
    const reason = window.prompt('Optional reason for rejecting this swap:');
    if (reason === null) return; // User pressed Cancel
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await rejectSwap(swapId, reason);
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to reject proposal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWithdraw = async (swapId) => {
    if (!window.confirm('Are you sure you want to withdraw this swap proposal?')) return;
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await withdrawSwap(swapId);
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to withdraw proposal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (swapId) => {
    const reason = window.prompt('Please provide a reason for cancelling this exchange:');
    if (!reason) return;
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await cancelSwap(swapId, reason);
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to cancel exchange.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmHandover = async (swapId) => {
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await confirmHandover(swapId);
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to confirm handover.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCounterSubmit = async (swapId) => {
    if (!counterMessage.trim()) {
      setServerError('Please enter a note describing your counter-offer terms.');
      return;
    }
    setActionLoadingId(swapId);
    setServerError(null);
    try {
      await counterSwap(swapId, { message: counterMessage.trim() });
      setActiveCounterSwapId(null);
      setCounterMessage('');
      await loadSwaps();
    } catch (err) {
      setServerError(err.message || 'Failed to submit counter-offer.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold">
            Pending Response
          </span>
        );
      case 'COUNTERED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-bold">
            Counter-Offered
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold">
            Accepted • Handover Needed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 text-[11px] font-bold">
            ✓ Completed & Swapped
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-[11px] font-bold">
            Rejected
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[11px] font-bold">
            Withdrawn
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[11px] font-bold">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-swaps-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rental/10 border border-rental/20 text-rental dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Repeat className="size-3.5" />
            <span>Campus Circular Exchanges</span>
          </div>
          <h2 id="my-swaps-title" className="text-2xl font-black tracking-tight text-text">
            My Circular Swaps
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Track incoming offers, submit counter-proposals, and confirm physical handovers.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 mb-4 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'incoming'
                ? 'border-rental text-rental dark:text-orange-400'
                : 'border-transparent text-stone-500 hover:text-text'
            }`}
          >
            Incoming Proposals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'outgoing'
                ? 'border-rental text-rental dark:text-orange-400'
                : 'border-transparent text-stone-500 hover:text-text'
            }`}
          >
            Outgoing Proposals
          </button>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Swaps List Scroll Area */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-rental" />
              <span>Loading swap proposals...</span>
            </div>
          ) : swaps.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-xs p-6 rounded-2xl bg-background border border-stone-200 dark:border-stone-800">
              <Repeat className="size-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-text">No {activeTab} swap proposals found.</p>
              <p className="text-[11px] text-stone-400 mt-1">
                {activeTab === 'incoming'
                  ? 'When students propose a trade for your items, they will appear here.'
                  : 'Propose swaps for items you find in the marketplace!'}
              </p>
            </div>
          ) : (
            swaps.map((swap) => {
              const isProposer = swap.proposer?._id === user?._id;
              const isTurn = swap.currentTurn === user?._id;
              const isActionLoading = actionLoadingId === swap._id;

              return (
                <div
                  key={swap._id}
                  className="p-5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    {getStatusBadge(swap.status)}
                    <span className="text-[11px] text-stone-500">
                      {isProposer ? `With ${swap.recipient?.name}` : `From ${swap.proposer?.name}`} •{' '}
                      {swap.recipient?.campus || 'Main Campus'}
                    </span>
                  </div>

                  {/* Item Exchange Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Offered Item:
                      </span>
                      <p className="font-bold text-text mt-0.5 truncate">
                        {swap.offeredListing?.title || 'Listing item'}
                      </p>
                      <span className="text-[11px] text-stone-500">
                        {swap.offeredListing?.category} • {swap.offeredListing?.condition}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-rental dark:text-orange-400 block">
                        Requested in Return:
                      </span>
                      <p className="font-bold text-text mt-0.5 truncate">
                        {swap.requestedListing?.title || 'Listing item'}
                      </p>
                      <span className="text-[11px] text-stone-500">
                        {swap.requestedListing?.category} • {swap.requestedListing?.condition}
                      </span>
                    </div>
                  </div>

                  {/* Message / Counter-Offer Notes */}
                  {swap.initialMessage && (
                    <div className="text-xs p-2.5 rounded-lg bg-background border border-stone-200/60 dark:border-stone-800/80 flex items-start gap-2 text-stone-600 dark:text-stone-300">
                      <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-stone-400" />
                      <span>{swap.initialMessage}</span>
                    </div>
                  )}

                  {/* Counter-offer history note */}
                  {swap.counterOffers?.length > 0 && (
                    <div className="text-[11px] p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-300">
                      <span className="font-bold">Latest Counter-Offer:</span>{' '}
                      {swap.counterOffers[swap.counterOffers.length - 1].message || 'Updated terms proposed'}
                    </div>
                  )}

                  {/* Handover Checklist for ACCEPTED Status */}
                  {swap.status === 'ACCEPTED' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                        <ShieldCheck className="size-4" />
                        <span>Physical Handover Checklist</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        Meet safely at the designated campus pickup spot. Both students must independently confirm receipt.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {swap.handoverConfirmations?.proposerConfirmed ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="size-3.5 text-amber-500" />
                          )}
                          <span>Proposer: {swap.handoverConfirmations?.proposerConfirmed ? 'Confirmed' : 'Pending'}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {swap.handoverConfirmations?.recipientConfirmed ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="size-3.5 text-amber-500" />
                          )}
                          <span>Recipient: {swap.handoverConfirmations?.recipientConfirmed ? 'Confirmed' : 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Counter Form */}
                  {activeCounterSwapId === swap._id && (
                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                      <label className="block font-bold text-purple-900 dark:text-purple-300">
                        Counter-Offer Note / Terms:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="State your proposed adjustments or preferred exchange conditions..."
                        value={counterMessage}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-stone-300 dark:border-stone-700 text-xs focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveCounterSwapId(null)}
                          className="px-3 py-1 rounded-lg border border-stone-300 text-stone-600 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCounterSubmit(swap._id)}
                          className="px-3 py-1 rounded-lg bg-purple-700 text-white text-xs font-bold hover:bg-purple-800"
                        >
                          Send Counter-Offer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
                    {/* Recipient Actions when Pending/Countered */}
                    {(swap.status === 'PENDING' || swap.status === 'COUNTERED') && isTurn && (
                      <>
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleAccept(swap._id)}
                          className="px-3 py-1.5 rounded-xl bg-sustainability hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          {isActionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                          <span>Accept Swap</span>
                        </button>

                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => {
                            setActiveCounterSwapId(swap._id);
                            setCounterMessage('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Repeat className="size-3.5" />
                          <span>Counter-Offer</span>
                        </button>

                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleReject(swap._id)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-xs transition"
                        >
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* Proposer / Active Sender Withdraw Action */}
                    {(swap.status === 'PENDING' || swap.status === 'COUNTERED') && !isTurn && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleWithdraw(swap._id)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Undo2 className="size-3.5" />
                        <span>Withdraw Proposal</span>
                      </button>
                    )}

                    {/* Handover & Cancellation for ACCEPTED Exchanges */}
                    {swap.status === 'ACCEPTED' && (
                      <>
                        {/* Only show Confirm Handover if this user hasn't confirmed yet */}
                        {((isProposer && !swap.handoverConfirmations?.proposerConfirmed) ||
                          (!isProposer && !swap.handoverConfirmations?.recipientConfirmed)) && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleConfirmHandover(swap._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-sustainability hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                          >
                            {isActionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                            <span>I Have Handed Over Item</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleCancel(swap._id)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
                        >
                          <span>Cancel Exchange</span>
                        </button>
                      </>
                    )}

                    {/* Review Button for Completed Swap */}
                    {swap.status === 'COMPLETED' && onLeaveReview && (
                      <button
                        type="button"
                        onClick={() =>
                          onLeaveReview({
                            targetUser: isProposer ? swap.recipient : swap.proposer,
                            listing: isProposer ? swap.requestedListing : swap.offeredListing,
                            transactionType: 'SWAP',
                            transactionId: swap._id,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <Star className="size-3.5 fill-white text-white" />
                        <span>Leave Verified Review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MySwapsModal;
