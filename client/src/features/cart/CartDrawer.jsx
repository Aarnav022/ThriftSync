import React, { useEffect, useRef } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Sparkles, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../utils/currency.js';

export function CartDrawer({
  isOpen,
  onClose,
  cartData,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = cartData?.items || [];
  const totals = cartData?.totals || {
    subtotalPaise: 0,
    shippingPaise: 4900,
    totalPaise: 4900,
    isFreeShipping: false,
    amountNeededForFreeShippingPaise: 49900,
  };

  const progressPercent = Math.min(
    100,
    Math.round((totals.subtotalPaise / 49900) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-surface dark:bg-[#1E1D1B] border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-sustainability" />
              <h2 id="cart-drawer-title" className="text-base font-bold text-text">
                My Shopping Bag ({items.reduce((acc, i) => acc + (i.quantity || 1), 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-text transition"
              aria-label="Close cart"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-5 py-3 bg-stone-100/70 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
            {totals.isFreeShipping ? (
              <div className="flex items-center gap-2 text-xs font-bold text-sustainability dark:text-green-400">
                <Sparkles className="size-4 shrink-0" />
                <span>You unlocked FREE delivery across campus!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="size-3.5 text-rental" />
                    <span>
                      Add <strong className="text-text">{formatINR(totals.amountNeededForFreeShippingPaise)}</strong> more for FREE delivery
                    </span>
                  </span>
                  <span className="font-bold text-text">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sustainability transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <ShoppingBag className="size-12 text-stone-300 dark:text-stone-700 mb-3 stroke-[1.5]" />
                <p className="font-bold text-sm text-text">Your bag is empty</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Discover pre-loved textbooks, clothing, and campus essentials from verified peers.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const listing = item.listing || {};
                const unitPricePaise =
                  listing.pricePaise ||
                  (typeof listing.price === 'number' ? Math.round(listing.price * 100) : 0) ||
                  item.priceSnapshotPaise ||
                  0;
                const lineTotalPaise = unitPricePaise * (item.quantity || 1);

                return (
                  <div
                    key={item._id || item.sku || listing._id}
                    className="p-3.5 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 flex items-center gap-3.5"
                  >
                    {/* Item Image */}
                    <div className="size-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 shrink-0 border border-stone-200/60 dark:border-stone-800 flex items-center justify-center">
                      {listing.images && listing.images[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="size-6 text-stone-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-text truncate">
                        {listing.title || 'Pre-owned Campus Item'}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {listing.condition || 'Verified Peer Item'}
                      </p>
                      <p className="text-xs font-black text-text mt-1">
                        {formatINR(lineTotalPaise)}
                      </p>
                    </div>

                    {/* Quantity Stepper & Delete */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(listing._id || item.listing)}
                        className="text-stone-400 hover:text-red-600 transition p-1"
                        title="Remove item"
                        aria-label="Remove item from bag"
                      >
                        <Trash2 className="size-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5 border border-stone-300 dark:border-stone-700 rounded-lg px-1.5 py-0.5 bg-surface dark:bg-stone-900">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              listing._id || item.listing,
                              Math.max(1, (item.quantity || 1) - 1)
                            )
                          }
                          disabled={(item.quantity || 1) <= 1}
                          className="text-stone-500 hover:text-text disabled:opacity-30 p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-xs font-bold text-text min-w-4 text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              listing._id || item.listing,
                              (item.quantity || 1) + 1
                            )
                          }
                          disabled={(item.quantity || 1) >= (listing.availableStock || 5)}
                          className="text-stone-500 hover:text-text disabled:opacity-30 p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-background/50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-text">{formatINR(totals.subtotalPaise)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Delivery Charges</span>
                  <span className={`font-bold ${totals.isFreeShipping ? 'text-sustainability dark:text-green-400' : 'text-text'}`}>
                    {totals.isFreeShipping ? 'FREE' : formatINR(totals.shippingPaise)}
                  </span>
                </div>
                <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex items-center justify-between text-sm font-black text-text">
                  <span>Total Amount</span>
                  <span>{formatINR(totals.totalPaise)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                <ShieldCheck className="size-3.5 text-sustainability shrink-0" />
                <span>100% verified student handover & protected checkout</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
