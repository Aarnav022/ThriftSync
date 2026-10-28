import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  ThumbsUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { submitReview } from './reviewService.js';

export function LeaveReviewModal({
  isOpen,
  onClose,
  targetUser,
  listing,
  transactionType,
  transactionId,
  onReviewSubmitted,
}) {
  const modalRef = useRef(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [itemConditionAsDescribed, setItemConditionAsDescribed] = useState(true);
  const [punctualHandover, setPunctualHandover] = useState(true);
  const [communication, setCommunication] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setReviewText('');
      setItemConditionAsDescribed(true);
      setPunctualHandover(true);
      setCommunication(5);
      setServerError(null);
      setSuccess(false);
    }
  }, [isOpen, targetUser, transactionId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetUser) return null;

  const targetUserId = targetUser._id || targetUser.id;
  const listingId = listing?._id || listing?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!reviewText || reviewText.trim().length < 5) {
      setServerError('Please provide at least 5 characters of feedback for your peer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await submitReview({
        targetUserId,
        listingId,
        transactionType,
        transactionId,
        rating,
        reviewText: reviewText.trim(),
        itemConditionAsDescribed,
        punctualHandover,
        communication,
      });

      setSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted(review);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-16 bg-sustainability/10 text-sustainability rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>
            <h3 className="text-xl font-black text-text">Verified Review Submitted!</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
              Thank you for strengthening campus accountability. Your rating has been added to <span className="font-bold text-text">{targetUser.name}</span>&apos;s verified trust score.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sustainability">
              <ShieldCheck className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Verified Campus Peer Review</span>
            </div>
            <h3 id="review-modal-title" className="text-xl font-black text-text">
              Review {targetUser.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Share authentic feedback from your completed {transactionType.toLowerCase()} to guide fellow students.
            </p>

            {/* Transaction item banner */}
            {listing && (
              <div className="mt-4 p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="font-bold text-text truncate mr-2">{listing.title}</span>
                <span className="text-[10px] uppercase font-bold text-sustainability px-2 py-0.5 rounded-full bg-sustainability/10 shrink-0">
                  Verified {transactionType}
                </span>
              </div>
            )}

            {serverError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-[11px] font-bold text-text mb-1.5">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800 transition focus:outline-none"
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`size-6 transition ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300 dark:text-stone-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-bold text-stone-600 dark:text-stone-300">
                    {rating === 5 && 'Outstanding (5/5)'}
                    {rating === 4 && 'Good Experience (4/5)'}
                    {rating === 3 && 'Average (3/5)'}
                    {rating === 2 && 'Below Expectations (2/5)'}
                    {rating === 1 && 'Unsatisfactory (1/5)'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label htmlFor="review-feedback" className="block text-[11px] font-bold text-text mb-1">
                  Written Feedback (Min 5 chars) *
                </label>
                <textarea
                  id="review-feedback"
                  required
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe your exchange experience, item condition, and handover punctuality..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability/40 placeholder:text-stone-400"
                />
              </div>

              {/* Trust Criteria Toggles */}
              <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
                <span className="text-[11px] font-bold text-text block">
                  Campus Trust Criteria
                </span>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <ThumbsUp className="size-3.5 text-sustainability" />
                    Item condition matched description
                  </span>
                  <input
                    type="checkbox"
                    checked={itemConditionAsDescribed}
                    onChange={(e) => setItemConditionAsDescribed(e.target.checked)}
                    className="size-4 text-sustainability rounded accent-[#1E4D2B]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-rental" />
                    Punctual meetup at safe campus spot
                  </span>
                  <input
                    type="checkbox"
                    checked={punctualHandover}
                    onChange={(e) => setPunctualHandover(e.target.checked)}
                    className="size-4 text-sustainability rounded accent-[#1E4D2B]"
                  />
                </label>
              </div>

              {/* Form Controls */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Verified Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveReviewModal;
