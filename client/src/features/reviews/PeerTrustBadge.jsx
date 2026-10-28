import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, CheckCircle2, UserCheck, X, ThumbsUp, Clock, Loader2 } from 'lucide-react';
import { fetchUserTrustMetrics } from './reviewService.js';

export function PeerTrustBadge({ userId, userName, showDetailsButton = true }) {
  const [metrics, setMetrics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserTrustMetrics(userId)
        .then((data) => {
          if (data?.trustMetrics) setMetrics(data.trustMetrics);
          if (data?.reviews) setReviews(data.reviews);
        })
        .catch(() => {
          // Fallback gracefully without breaking UI
        });
    }
  }, [userId]);

  const rating = metrics ? metrics.averageRating : 5.0;
  const count = metrics ? metrics.totalReviews : 0;

  return (
    <>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <div className="flex items-center gap-1 text-amber-500 font-extrabold">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
        <span className="text-stone-400">•</span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-stone-600 dark:text-stone-300 hover:text-sustainability underline decoration-stone-300 text-[11px]"
          title="View verified peer reviews"
        >
          {count} {count === 1 ? 'review' : 'reviews'}
        </button>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-sustainability/10 text-sustainability text-[10px] font-bold">
          <ShieldCheck className="size-3" />
          Verified
        </span>
      </div>

      {/* Peer Reviews Detail Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 relative text-text flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="size-5 text-sustainability" />
              <h4 className="text-base font-black text-text">
                {userName || 'Campus Peer'} — Verified Trust Profile
              </h4>
            </div>

            {/* Metrics cards */}
            {metrics && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-center text-xs mb-3">
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-semibold block">Average</span>
                  <span className="font-black text-amber-500 text-sm flex items-center justify-center gap-1">
                    <Star className="size-3.5 fill-amber-400" />
                    {metrics.averageRating.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-semibold block">Accuracy</span>
                  <span className="font-bold text-sustainability text-sm">
                    {metrics.conditionAccuracyRate}%
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-semibold block">Punctuality</span>
                  <span className="font-bold text-text text-sm">
                    {metrics.punctualityRate}%
                  </span>
                </div>
              </div>
            )}

            {/* Reviews list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {reviews.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  No verified peer reviews submitted yet for this student.
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text">
                        {rev.author?.name || 'Student Peer'}
                        {rev.author?.campus && ` (${rev.author.campus})`}
                      </span>
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="size-3 fill-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
                      &quot;{rev.reviewText}&quot;
                    </p>
                    <span className="text-[10px] text-stone-400 block">
                      Verified {rev.transactionType} • {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PeerTrustBadge;
