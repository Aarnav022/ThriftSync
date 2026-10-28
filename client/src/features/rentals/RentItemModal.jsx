import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import { requestRental } from './rentalService.js';

export function RentItemModal({ isOpen, onClose, listing, onRentalRequested }) {
  const modalRef = useRef(null);

  // Default to starting tomorrow and ending 1 month later
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(nextMonthStr);
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStartDate(tomorrowStr);
      setEndDate(nextMonthStr);
      setNotes('');
      setFieldErrors({});
      setServerError(null);
      setSuccessData(null);
    }
  }, [isOpen, listing]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !listing) return null;

  // Calculation helpers
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let durationUnits = 1;
  const period = listing.rentalPeriod || 'per semester';

  if (period === 'per day') {
    durationUnits = diffDays;
  } else if (period === 'per week') {
    durationUnits = Math.max(1, Math.ceil(diffDays / 7));
  } else if (period === 'per month') {
    durationUnits = Math.max(1, Math.ceil(diffDays / 30));
  } else {
    durationUnits = 1;
  }

  const rate = Number(listing.rentalRate) || 0;
  const estimatedFee = Math.round(rate * durationUnits * 100) / 100;
  const deposit = Number(listing.deposit) || 0;
  const totalDueAtHandover = estimatedFee + deposit;

  const validate = () => {
    const errors = {};
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errors.endDate = 'End date must be after start date';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const rental = await requestRental({
        listingId: listing._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        notes,
      });

      setSuccessData(rental);
      if (onRentalRequested) {
        onRentalRequested(rental);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to submit rental request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rent-modal-title"
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

        {successData ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-16 bg-sustainability/10 text-sustainability rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>
            <h3 className="text-xl font-black text-text">Rental Request Submitted!</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
              Your booking request for <span className="font-bold text-text">"{listing.title}"</span> has been sent to the student owner. You will meet at the designated campus zone once approved.
            </p>

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Rental Duration:</span>
                <span className="font-bold text-text">{diffDays} days ({durationUnits} {period.replace('per ', '')}{durationUnits > 1 ? 's' : ''})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Rental Fee:</span>
                <span className="font-bold text-rental dark:text-orange-400">${estimatedFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Refundable Deposit:</span>
                <span className="font-bold text-sustainability dark:text-green-400">${deposit.toFixed(2)}</span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between font-bold">
                <span>Handover Total:</span>
                <span>${totalDueAtHandover.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
            >
              Done & View Rentals
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2 text-rental">
              <Clock className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Campus Peer Rental</span>
            </div>
            <h3 id="rent-modal-title" className="text-xl font-black text-text">
              Request to Rent Item
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Borrow from a verified peer on campus with separate deposit tracking and safe return inspection.
            </p>

            {/* Target Item Summary */}
            <div className="mt-4 p-3.5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <div className="truncate mr-2">
                <span className="font-bold text-text block truncate">{listing.title}</span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  {listing.category} • {listing.condition}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-rental dark:text-orange-400 block">
                  ${rate.toFixed(2)} <span className="text-[10px] text-stone-500">/{period.replace('per ', '')}</span>
                </span>
                <span className="text-[10px] text-stone-400">
                  +${deposit.toFixed(2)} deposit
                </span>
              </div>
            </div>

            {serverError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Rental Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rent-start-date" className="block text-[11px] font-bold text-text mb-1">
                    Start Date *
                  </label>
                  <input
                    id="rent-start-date"
                    type="date"
                    min={tomorrowStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-rental/40"
                  />
                  {fieldErrors.startDate && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{fieldErrors.startDate}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="rent-end-date" className="block text-[11px] font-bold text-text mb-1">
                    Return Date *
                  </label>
                  <input
                    id="rent-end-date"
                    type="date"
                    min={startDate || tomorrowStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-rental/40"
                  />
                  {fieldErrors.endDate && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{fieldErrors.endDate}</span>
                  )}
                </div>
              </div>

              {/* Booking Message / Note */}
              <div>
                <label htmlFor="rent-notes" className="block text-[11px] font-bold text-text mb-1">
                  Message for Owner (Optional)
                </label>
                <textarea
                  id="rent-notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="e.g. Need this calculator for Midterm Prep, available to meet at Library Plaza."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-rental/40 placeholder:text-stone-400"
                />
              </div>

              {/* Accounting Breakdown: Separating Rental Fee and Refundable Deposit */}
              <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-rental" />
                    Calculated Rental Fee ({durationUnits} {period.replace('per ', '')}{durationUnits > 1 ? 's' : ''})
                  </span>
                  <span className="font-bold text-rental dark:text-orange-400">${estimatedFee.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-sustainability" />
                    Refundable Security Deposit
                  </span>
                  <span className="font-bold text-sustainability dark:text-green-400">${deposit.toFixed(2)}</span>
                </div>

                <p className="text-[10px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-200 dark:border-stone-800">
                  ℹ️ Security deposit is held safely in escrow and refunded back upon prompt return in agreed condition.
                </p>

                <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex items-center justify-between font-extrabold text-sm text-text">
                  <span>Total at Handover:</span>
                  <span>${totalDueAtHandover.toFixed(2)}</span>
                </div>
              </div>

              {/* Handover Zone Note */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300">
                <MapPin className="size-3.5 text-sustainability shrink-0" />
                <span>
                  Designated campus pickup: <strong className="text-text">{listing.pickupLocation || 'Campus Student Center'}</strong>
                </span>
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
                  className="flex-1 py-2.5 rounded-xl bg-rental hover:bg-orange-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <span>Submit Rental Request</span>
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

export default RentItemModal;
