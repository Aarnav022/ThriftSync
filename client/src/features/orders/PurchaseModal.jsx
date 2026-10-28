import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { createOrder } from './orderService.js';

export function PurchaseModal({ isOpen, onClose, listing, onOrderPlaced }) {
  const modalRef = useRef(null);

  const [pickupLocation, setPickupLocation] = useState('Campus Student Center');
  const [meetupNotes, setMeetupNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CAMPUS_HANDOVER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPickupLocation(listing?.pickupLocation || 'Campus Student Center');
      setMeetupNotes('');
      setPaymentMethod('CAMPUS_HANDOVER');
      setServerError(null);
      setSuccessOrder(null);
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

  const itemPrice = typeof listing.price === 'number' ? listing.price : parseFloat(listing.price) || 0;
  const platformFee = 0.0; // 0% campus circular fee
  const totalAmount = itemPrice + platformFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        listingId: listing._id,
        pickupLocation,
        meetupNotes,
        paymentMethod,
      });

      setSuccessOrder(order);
      if (onOrderPlaced) {
        onOrderPlaced(order);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to place purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
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

        {successOrder ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-16 bg-sustainability/10 text-sustainability rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>
            <h3 className="text-xl font-black text-text">Order Confirmed & Item Reserved!</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto leading-relaxed">
              You have successfully reserved <span className="font-bold text-text">"{listing.title}"</span>. The item has been taken off the catalog and locked for you.
            </p>

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Item Price:</span>
                <span className="font-bold text-text">${itemPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Designated Handover:</span>
                <span className="font-bold text-text">{pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment:</span>
                <span className="font-bold text-sustainability">Verified Upon Bilateral Handover</span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between font-bold text-sm">
                <span>Total Due at Handover:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-sustainability text-white font-bold text-xs hover:bg-[#15361e] transition shadow-sm"
            >
              Done & View Purchases
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sustainability">
              <ShoppingBag className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Campus Outright Purchase</span>
            </div>
            <h3 id="purchase-modal-title" className="text-xl font-black text-text">
              Buy from Student Peer
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Lock this item instantly. Handover and payment verification take place safely on campus.
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
                <span className="font-extrabold text-base text-text block">
                  ${itemPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-sustainability font-semibold">
                  0% Circular Fee
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
              {/* Pickup Location Selection */}
              <div>
                <label htmlFor="order-pickup-location" className="block text-[11px] font-bold text-text mb-1">
                  Safe On-Campus Handover Zone *
                </label>
                <div className="relative">
                  <input
                    id="order-pickup-location"
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Campus Student Center, Library Plaza"
                    className="w-full px-3 py-2 pl-8 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability/40"
                  />
                  <MapPin className="size-4 text-stone-400 absolute left-2.5 top-2.5" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Campus Student Center', 'Main Library Desk', 'Science Commons'].map((spot) => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => setPickupLocation(spot)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition ${
                        pickupLocation === spot
                          ? 'bg-sustainability text-white border-sustainability'
                          : 'bg-background hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {spot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meetup message */}
              <div>
                <label htmlFor="order-meetup-notes" className="block text-[11px] font-bold text-text mb-1">
                  Availability / Message for Seller (Optional)
                </label>
                <textarea
                  id="order-meetup-notes"
                  rows={2}
                  maxLength={1000}
                  placeholder="e.g. Free to meet today between 3pm and 5pm after class."
                  value={meetupNotes}
                  onChange={(e) => setMeetupNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability/40 placeholder:text-stone-400"
                />
              </div>

              {/* Payment Verification Method Notice */}
              <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <Tag className="size-3.5 text-stone-400" /> Item Price
                  </span>
                  <span className="font-bold text-text">${itemPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-sustainability" /> Campus Circular Commission
                  </span>
                  <span className="font-bold text-sustainability">$0.00 (Free)</span>
                </div>
                <div className="border-t border-stone-200 dark:border-stone-800 pt-1.5 flex items-center justify-between font-extrabold text-sm text-text">
                  <span>Total Due Upon Meetup:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 pt-1">
                  🛡️ Both you and the seller confirm the physical exchange upon inspection before payment is recorded as verified.
                </p>
              </div>

              {/* Form buttons */}
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
                      <span>Reserving Item...</span>
                    </>
                  ) : (
                    <span>Confirm & Reserve Item</span>
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

export default PurchaseModal;
