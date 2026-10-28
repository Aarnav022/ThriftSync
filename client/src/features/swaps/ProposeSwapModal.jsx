import React, { useState, useEffect, useRef } from 'react';
import { X, Repeat, Sparkles, AlertCircle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { proposeSwap } from './swapService.js';
import { fetchMyListings } from '../listings/listingService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function ProposeSwapModal({
  isOpen,
  onClose,
  targetListing,
  onProposalSubmitted,
  onOpenCreateListing,
}) {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [selectedOfferedId, setSelectedOfferedId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setServerError(null);
      setMessage('');
      setSelectedOfferedId('');
      setIsLoadingListings(true);

      fetchMyListings()
        .then((items) => {
          const active = (items || []).filter(
            (i) => i.status === 'active' && i._id !== targetListing?._id
          );
          setMyListings(active);
          if (active.length > 0) {
            setSelectedOfferedId(active[0]._id);
          }
        })
        .catch((err) => {
          setServerError('Could not retrieve your listings: ' + (err.message || 'Network error'));
        })
        .finally(() => {
          setIsLoadingListings(false);
        });
    }
  }, [isOpen, targetListing]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetListing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!selectedOfferedId) {
      setServerError('Please select an item from your listings to offer in exchange.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdSwap = await proposeSwap({
        offeredListingId: selectedOfferedId,
        requestedListingId: targetListing._id,
        message: message.trim(),
      });

      if (onProposalSubmitted) {
        onProposalSubmitted(createdSwap);
      }
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to submit proposal. Please verify availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-swap-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
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
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rental/10 border border-rental/20 text-rental dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Repeat className="size-3.5" />
            <span>Direct Campus Exchange</span>
          </div>
          <h2 id="propose-swap-title" className="text-2xl font-black tracking-tight text-text">
            Propose a Circular Swap
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Exchange pre-owned goods directly without cash. Zero platform fees.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Target Requested Item Preview */}
        <div className="mb-5 p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rental dark:text-orange-400 block mb-1">
            Item You Are Requesting:
          </span>
          <h4 className="text-sm font-bold text-text">{targetListing.title}</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {targetListing.category} • {targetListing.condition} • {targetListing.campus || 'Main Campus'}
          </p>
          {targetListing.swapFor && (
            <p className="text-xs font-semibold text-sustainability dark:text-green-400 mt-1.5">
              Owner seeking: {targetListing.swapFor}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Offered Item */}
          <div>
            <label htmlFor="offered-item" className="block font-bold mb-1.5 text-text">
              Select Your Offered Item <span className="text-red-500">*</span>
            </label>

            {isLoadingListings ? (
              <div className="py-4 text-center text-stone-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-sustainability" />
                <span>Loading your campus listings...</span>
              </div>
            ) : myListings.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 space-y-2">
                <p className="font-semibold">You do not have any active listings to offer in exchange.</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCreateListing) onOpenCreateListing();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sustainability text-white font-bold text-xs hover:bg-emerald-800 transition"
                >
                  <span>Post an item first</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            ) : (
              <select
                id="offered-item"
                value={selectedOfferedId}
                onChange={(e) => setSelectedOfferedId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental"
              >
                {myListings.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title} ({item.category} • {item.condition})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional Message */}
          <div>
            <label htmlFor="swap-message" className="block font-bold mb-1 text-text">
              Note for Peer (Optional)
            </label>
            <textarea
              id="swap-message"
              rows={3}
              placeholder="e.g. Can meet in the South Quad lobby after 4pm on weekdays."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental resize-none"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || myListings.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-rental hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting Swap Proposal...</span>
                </>
              ) : (
                <>
                  <Repeat className="size-4" />
                  <span>Send Proposal to Peer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProposeSwapModal;
