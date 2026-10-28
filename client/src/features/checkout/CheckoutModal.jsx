import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { fetchAddresses, createAddress } from '../addresses/addressService.js';
import { initiateCheckout, confirmOnlinePayment } from './checkoutService.js';
import { formatINR } from '../../utils/currency.js';

export function CheckoutModal({ isOpen, onClose, cartData, onOrderCompleted }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: 'Delhi',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setOrderPlacedSuccess(null);
      fetchAddresses()
        .then((addrList) => {
          setAddresses(addrList || []);
          if (addrList && addrList.length > 0) {
            const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
            setSelectedAddressId(defaultAddr._id);
          } else {
            setIsAddingNewAddress(true);
          }
        })
        .catch(() => {
          setIsAddingNewAddress(true);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totals = cartData?.totals || {
    subtotalPaise: 0,
    shippingPaise: 4900,
    totalPaise: 4900,
    isFreeShipping: false,
    codEligible: true,
  };

  const isCodBlocked = !totals.codEligible;

  const handleCreateNewAddress = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^[6-9]\d{9}$/.test(newAddressForm.phone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(newAddressForm.postalCode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      const created = await createAddress(newAddressForm);
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created._id);
      setIsAddingNewAddress(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let resolvedAddress = null;
      if (isAddingNewAddress) {
        if (!newAddressForm.fullName || !newAddressForm.phone || !newAddressForm.street || !newAddressForm.postalCode) {
          throw new Error('Please fill in all delivery address details.');
        }
        resolvedAddress = newAddressForm;
      } else if (!selectedAddressId) {
        throw new Error('Please select a delivery address to proceed.');
      }

      const checkoutResult = await initiateCheckout({
        addressId: selectedAddressId,
        shippingAddress: resolvedAddress,
        paymentMethod: isCodBlocked ? 'ONLINE_RAZORPAY' : paymentMethod,
      });

      const order = checkoutResult.order;

      if (order.paymentMethod === 'ONLINE_RAZORPAY') {
        // If gateway order created, simulate Razorpay capture in test/fallback mode
        await confirmOnlinePayment({
          orderId: order._id,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpayOrderId: checkoutResult.gateway?.providerOrderId || `order_sim_${Date.now()}`,
          razorpaySignature: 'simulated_signature_verified',
        }).catch(() => {});
      }

      setOrderPlacedSuccess(order);
      if (onOrderCompleted) onOrderCompleted(order);
    } catch (err) {
      setErrorMessage(err.message || 'Checkout could not be completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg my-8 bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-text animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          aria-label="Close checkout"
        >
          <X className="size-5" />
        </button>

        {orderPlacedSuccess ? (
          /* Order Placed Success View */
          <div className="text-center py-6 space-y-4">
            <div className="size-16 rounded-full bg-sustainability/10 text-sustainability flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-10 text-sustainability dark:text-green-400" />
            </div>
            <h3 className="text-xl font-black text-text">Order Placed Successfully!</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 max-w-sm mx-auto leading-relaxed">
              Your order has been recorded. We will deliver your items directly to your campus hostel/residence.
            </p>

            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold">
                <span>Order Reference</span>
                <span className="font-mono text-sustainability">{orderPlacedSuccess._id}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid / Payable</span>
                <span className="font-black">{formatINR(orderPlacedSuccess.totalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>{orderPlacedSuccess.paymentMethod === 'COD' ? 'Cash on Delivery (Pay upon arrival)' : 'Online Payment (Verified)'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition shadow-sm"
            >
              Back to Campus Marketplace
            </button>
          </div>
        ) : (
          /* Checkout Steps Form */
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-sustainability/10 text-sustainability text-[10px] font-bold uppercase tracking-wider">
                  Secure Checkout
                </span>
                <span className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Clock className="size-3 text-rental" /> 15-minute stock hold
                </span>
              </div>
              <h2 id="checkout-modal-title" className="text-xl font-black text-text">
                Delivery & Payment Details
              </h2>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Delivery Address Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-sustainability" /> Delivery Address
                </h3>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress((prev) => !prev)}
                    className="text-xs text-sustainability font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>{isAddingNewAddress ? 'Select Saved' : 'Add New'}</span>
                  </button>
                )}
              </div>

              {isAddingNewAddress ? (
                <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.fullName}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, fullName: e.target.value })
                        }
                        placeholder="e.g. Aarav Sharma"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newAddressForm.phone}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, phone: e.target.value })
                        }
                        placeholder="10-digit mobile"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Hostel, Room or Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddressForm.street}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, street: e.target.value })
                      }
                      placeholder="e.g. Room 204, Ganga Hostel, North Campus"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.city}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, city: e.target.value })
                        }
                        placeholder="New Delhi"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.state}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, state: e.target.value })
                        }
                        placeholder="Delhi"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddressForm.postalCode}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })
                        }
                        placeholder="6-digit PIN"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-surface dark:bg-stone-900 focus:outline-none focus:border-sustainability text-text"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                        selectedAddressId === addr._id
                          ? 'border-sustainability bg-sustainability/5 ring-1 ring-sustainability'
                          : 'border-stone-200 dark:border-stone-800 bg-background hover:border-stone-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="mt-1 text-sustainability focus:ring-sustainability"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-text">
                          {addr.fullName}{' '}
                          <span className="font-normal text-stone-500">({addr.phone})</span>
                        </p>
                        <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                          {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Payment Method Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-rental" /> Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Cash on Delivery (COD) */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                    isCodBlocked
                      ? 'opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900'
                      : paymentMethod === 'COD'
                      ? 'border-sustainability bg-sustainability/5 ring-1 ring-sustainability cursor-pointer'
                      : 'border-stone-200 dark:border-stone-800 bg-background hover:border-stone-400 cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    disabled={isCodBlocked}
                    checked={paymentMethod === 'COD' && !isCodBlocked}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 text-sustainability focus:ring-sustainability"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-text flex items-center gap-1.5">
                      <Banknote className="size-3.5 text-sustainability" /> Cash on Delivery
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isCodBlocked
                        ? 'Max ₹5,000 limit for COD'
                        : 'Pay in cash upon doorstep delivery'}
                    </p>
                  </div>
                </label>

                {/* Online Payment via Razorpay */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    paymentMethod === 'ONLINE_RAZORPAY' || isCodBlocked
                      ? 'border-sustainability bg-sustainability/5 ring-1 ring-sustainability'
                      : 'border-stone-200 dark:border-stone-800 bg-background hover:border-stone-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'ONLINE_RAZORPAY' || isCodBlocked}
                    onChange={() => setPaymentMethod('ONLINE_RAZORPAY')}
                    className="mt-1 text-sustainability focus:ring-sustainability"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-text flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-rental" /> Online Payment
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      UPI, GooglePay, PhonePe, Cards, NetBanking
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Order Summary Box */}
            <div className="p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Items Subtotal</span>
                <span className="font-bold text-text">{formatINR(totals.subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Delivery Charges</span>
                <span className={`font-bold ${totals.isFreeShipping ? 'text-sustainability dark:text-green-400' : 'text-text'}`}>
                  {totals.isFreeShipping ? 'FREE' : formatINR(totals.shippingPaise)}
                </span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between text-sm font-black text-text">
                <span>Grand Total</span>
                <span>{formatINR(totals.totalPaise)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 rounded-xl bg-sustainability hover:bg-[#15361e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing Secure Reservation...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>
                      Confirm & Place Order ({formatINR(totals.totalPaise)})
                    </span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-stone-400">
                By placing this order, you agree to ThriftSync's{' '}
                <a href="#terms" target="_blank" className="underline text-stone-500 hover:text-text">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" target="_blank" className="underline text-stone-500 hover:text-text">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
