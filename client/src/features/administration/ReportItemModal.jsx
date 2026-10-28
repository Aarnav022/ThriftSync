import React, { useState, useEffect, useRef } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { submitReport } from './adminService.js';
import { useAuth } from '../authentication/authContext.jsx';

export function ReportItemModal({ isOpen, onClose, targetListing, onReportSubmitted }) {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState('PROHIBITED_ITEM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setReason('PROHIBITED_ITEM');
      setDescription('');
      setError(null);
      setIsSuccess(false);
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

  if (!isOpen || !targetListing) return null;

  const reasons = [
    { id: 'PROHIBITED_ITEM', label: 'Prohibited / Banned Campus Item' },
    { id: 'COUNTERFEIT_OR_SCAM', label: 'Counterfeit, Scam or Fake Item' },
    { id: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate or Offensive Listing' },
    { id: 'HARASSMENT_OR_SAFETY', label: 'Safety Concern or Harassment' },
    { id: 'MISREPRESENTATION', label: 'Blatantly Misrepresented Condition' },
    { id: 'OTHER', label: 'Other Campus Rule Violation' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('You must be signed in to submit a moderation report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitReport({
        targetType: 'LISTING',
        targetId: targetListing._id,
        reason,
        description: description.trim(),
      });

      setIsSuccess(true);
      if (onReportSubmitted) onReportSubmitted();
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close report dialog"
        >
          <X className="size-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="size-12 rounded-full bg-sustainability/10 text-sustainability mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-text">Report Submitted</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
              Thank you for keeping ThriftSync safe. Campus administrators will investigate this item promptly.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-sustainability text-white text-xs font-bold hover:bg-emerald-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-rental dark:text-orange-400 mb-2">
              <Flag className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Campus Safety Report</span>
            </div>
            <h2 id="report-modal-title" className="text-xl font-bold text-text mb-1">
              Report Listing
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 truncate">
              Item: &ldquo;{targetListing.title}&rdquo;
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5 text-text">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {reasons.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                        reason === r.id
                          ? 'border-rental bg-rental/5 text-rental dark:text-orange-400 font-bold'
                          : 'border-stone-200 dark:border-stone-800 bg-background text-stone-700 dark:text-stone-300 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={(e) => setReason(e.target.value)}
                        className="sr-only"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="report-description" className="block font-bold mb-1 text-text">
                  Additional Details (Optional)
                </label>
                <textarea
                  id="report-description"
                  rows={3}
                  placeholder="Provide context to help campus moderators evaluate this listing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-text text-xs focus:outline-none focus:ring-2 focus:ring-rental resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rental hover:bg-orange-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
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

export default ReportItemModal;
