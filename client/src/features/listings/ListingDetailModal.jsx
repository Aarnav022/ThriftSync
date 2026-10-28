import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Clock, ShieldCheck, Repeat, MapPin, UserCheck, Calendar, Sparkles, ShoppingBag, Flag } from 'lucide-react';
import { PeerTrustBadge } from '../reviews/PeerTrustBadge.jsx';
import { formatINR } from '../../utils/currency.js';

export function ListingDetailModal({ listing, isOpen, onClose, onProposeSwap, onRentItem, onBuyItem, onReportListing }) {
  const modalRef = useRef(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [listing]);

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

  const isRentable = listing.listingType === 'rent' || listing.listingType === 'buy_and_rent' || listing.rentalRate;
  const isPurchasable = listing.listingType === 'buy' || listing.listingType === 'buy_and_rent' || listing.price !== null;
  const isSwap = listing.listingType === 'swap' || listing.swapFor;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close details"
        >
          <X className="size-5" />
        </button>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sustainability/10 text-sustainability dark:text-green-400 text-xs font-bold border border-sustainability/20">
            <Sparkles className="size-3" />
            {listing.category}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium border border-stone-300 dark:border-stone-700">
            {listing.condition}
          </span>
          {listing.isIllustrative && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              Sample Item
            </span>
          )}
        </div>

        {/* Image Showcase Gallery (if listing has uploaded images) */}
        {listing.images && listing.images.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 aspect-video max-h-60 w-full flex items-center justify-center">
              <img
                src={listing.images[activeImageIndex] || listing.images[0]}
                alt={`${listing.title} view ${activeImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs">
                {activeImageIndex + 1} / {listing.images.length}
              </span>
            </div>

            {listing.images.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {listing.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`View photo ${idx + 1}`}
                    className={`relative size-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-sustainability ring-2 ring-sustainability/30'
                        : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h3 id="listing-detail-title" className="text-xl sm:text-2xl font-black text-text leading-tight">
          {listing.title}
        </h3>

        {/* Pricing & Terms Grid */}
        <div className="mt-5 p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3">
          {isPurchasable && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium">
                <Tag className="size-3.5 text-sustainability" /> Outright Purchase
              </span>
              <span className="text-lg font-black text-text">
                {formatINR(listing.pricePaise || (typeof listing.price === 'number' ? listing.price * 100 : 0))}
              </span>
            </div>
          )}

          {isRentable && (
            <div className="border-t border-stone-200/80 dark:border-stone-800 pt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 text-rental" /> Rental Fee
                </span>
                <span className="text-sm font-bold text-rental dark:text-orange-400">
                  {formatINR(typeof listing.rentalRate === 'number' ? listing.rentalRate * 100 : 0)} / {listing.rentalPeriod || 'semester'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-stone-400" /> Refundable Security Deposit
                </span>
                <span className="font-semibold text-text">
                  {formatINR(typeof listing.deposit === 'number' ? listing.deposit * 100 : 0)}
                </span>
              </div>
            </div>
          )}

          {isSwap && (
            <div className="border-t border-stone-200/80 dark:border-stone-800 pt-3">
              <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium mb-1">
                <Repeat className="size-3.5 text-rental" /> Seeking in Swap
              </span>
              <p className="text-xs font-bold text-sustainability dark:text-green-400">
                {listing.swapFor || 'Open to relevant peer exchanges'}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
            About This Item
          </h4>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-background/50 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
            {listing.description || 'Clean, verified pre-owned campus item in stated condition.'}
          </p>
        </div>

        {/* Campus & Pickup */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-semibold">
              Location
            </span>
            <div className="flex items-center gap-1.5 font-bold text-text mt-0.5">
              <MapPin className="size-3 text-sustainability" />
              <span>{listing.campus || 'Main Campus'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800">
            <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-semibold">
              Handover Zone
            </span>
            <span className="font-bold text-text mt-0.5 block truncate">
              {listing.pickupLocation || 'Student Center Desk'}
            </span>
          </div>
        </div>

        {/* Seller Info & Verified Trust */}
        <div className="mt-5 p-3 rounded-xl bg-surface dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-sustainability/10 text-sustainability flex items-center justify-center font-bold">
              <UserCheck className="size-4" />
            </div>
            <div>
              <span className="font-bold text-text block">
                {listing.seller?.name || 'Verified Student Peer'}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">
                {listing.seller?.campus || listing.campus || 'Active Student'}
              </span>
            </div>
          </div>
          {listing.seller && (
            <PeerTrustBadge
              userId={listing.seller?._id || listing.seller}
              userName={listing.seller?.name}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          {onBuyItem && isPurchasable && !listing.isIllustrative && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyItem(listing);
              }}
              className="flex-1 py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="size-3.5" />
              <span>Add to Bag ({formatINR(listing.pricePaise || (typeof listing.price === 'number' ? listing.price * 100 : 0))})</span>
            </button>
          )}

          {onRentItem && isRentable && !listing.isIllustrative && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRentItem(listing);
              }}
              className="flex-1 py-2.5 rounded-xl bg-rental hover:bg-orange-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Clock className="size-3.5" />
              <span>Request Rental</span>
            </button>
          )}

          {onProposeSwap && (isSwap || listing.listingType === 'swap') && !listing.isIllustrative && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onProposeSwap(listing);
              }}
              className="flex-1 py-2.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Repeat className="size-3.5" />
              <span>Propose Circular Swap</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-text hover:bg-black dark:bg-stone-200 dark:hover:bg-white dark:text-stone-900 text-white text-xs font-bold transition shadow-sm text-center"
          >
            Close Details
          </button>
        </div>

        {/* Flag / Moderation Reporting */}
        {onReportListing && !listing.isIllustrative && (
          <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Notice an issue or policy violation?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReportListing(listing);
              }}
              className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition"
              title="Report this listing to campus moderation"
            >
              <Flag className="size-3.5 text-stone-400 hover:text-red-500" />
              <span>Report Item</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListingDetailModal;
