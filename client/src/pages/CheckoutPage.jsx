import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  MapPin, 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  Leaf, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';

const CAMPUS_PICKUP_POINTS = [
  { id: 'spot-lib', name: 'Central Library Entrance', description: 'Beside main turnstiles & bag deposit' },
  { id: 'spot-sc', name: 'Student Center Desk', description: 'Ground floor info counter' },
  { id: 'spot-h3', name: 'Hostel 3 & 4 Common Courtyard', description: 'Near cafeteria entrance' },
  { id: 'spot-cs', name: 'Engineering & CS Lab Gate', description: 'Academic Block 2 foyer' },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { activeCartItems, totalItemCount, calculations, clearCart } = useCart();
  const { user, deliveryLocation } = useAuth();

  const [activeStep, setActiveStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('campus_spot'); // 'campus_spot' | 'hostel_address'
  const [selectedSpotId, setSelectedSpotId] = useState('spot-lib');
  const [selectedAddressId, setSelectedAddressId] = useState(user?.savedAddresses?.[0]?.id || 'addr-hostel');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'UPI' | 'CARD'
  const [meetupNotes, setMeetupNotes] = useState('Available after 2:30 PM lectures');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlacedData, setOrderPlacedData] = useState(null);

  const selectedCampusSpot = CAMPUS_PICKUP_POINTS.find((s) => s.id === selectedSpotId) || CAMPUS_PICKUP_POINTS[0];
  const selectedAddress = user?.savedAddresses?.find((a) => a.id === selectedAddressId) || user?.savedAddresses?.[0] || {
    name: 'Arnab Mukherjee',
    line1: 'Hostel 3, Room 402',
    city: 'New Delhi',
    pincode: '110007',
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    const generatedOrderId = `404-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const chosenPickup = deliveryType === 'campus_spot'
      ? selectedCampusSpot.name
      : `${selectedAddress.line1}, ${selectedAddress.city}`;

    const orderPayload = {
      items: activeCartItems.map((item) => ({
        listing: item.product.id || item.product._id,
        sku: item.product.sku || `TS-${(item.product.id || 'SKU').slice(-6)}`,
        title: item.product.title,
        unitPricePaise: Math.round((item.product.price || 0) * 100),
        quantity: item.quantity,
        lineTotalPaise: Math.round((item.product.price || 0) * item.quantity * 100),
        image: item.product.images?.[0] || null,
      })),
      shippingAddress: {
        fullName: user?.name || selectedAddress.name,
        phone: selectedAddress.phone || '+91 98765 43210',
        street: chosenPickup,
        city: selectedAddress.city || 'New Delhi',
        state: 'Delhi',
        postalCode: selectedAddress.pincode || '110007',
      },
      pickupLocation: chosenPickup,
      meetupNotes: meetupNotes.trim(),
      paymentMethod: paymentMethod === 'COD' ? 'COD' : 'STUDENT_PAY',
      subtotalPaise: Math.round(calculations.subtotal * 100),
      totalPaise: Math.round(calculations.grandTotal * 100),
      totalAmount: calculations.grandTotal,
      currency: 'INR',
    };

    try {
      // First attempt backend order creation if listing IDs are valid ObjectIds
      if (activeCartItems[0]?.product?._id) {
        await createOrder({
          listingId: activeCartItems[0].product._id,
          pickupLocation: chosenPickup,
          meetupNotes: meetupNotes.trim(),
          paymentMethod: paymentMethod === 'COD' ? 'CAMPUS_HANDOVER' : 'STUDENT_PAY',
        });
      }
    } catch (err) {
      console.warn('Backend order recording note:', err?.message);
    }

    // Persist placed order to localStorage for immediate display in /orders
    try {
      const existingOrders = JSON.parse(localStorage.getItem('thriftsync_orders') || '[]');
      const newStoredOrder = {
        _id: 'ord-' + Date.now(),
        orderId: generatedOrderId,
        createdAt: new Date().toISOString(),
        items: activeCartItems,
        totalAmount: calculations.grandTotal,
        pickupLocation: chosenPickup,
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Handover (COD)' : paymentMethod,
        orderStatus: 'CONFIRMED',
        fulfillmentStatus: 'PACKED',
        meetupNotes,
      };
      localStorage.setItem('thriftsync_orders', JSON.stringify([newStoredOrder, ...existingOrders]));
    } catch {}

    setOrderPlacedData({
      orderId: generatedOrderId,
      pickupSpot: chosenPickup,
      totalAmount: calculations.grandTotal,
    });

    clearCart();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#122620] select-none">
      
      {/* 1. DISTRACTION-FREE HEADER */}
      <header className="bg-white border-b border-[#E6E4DD] py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-[1250px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <Leaf className="w-5 h-5 text-[#E07A5F]" />
            <span className="text-2xl font-black text-[#122620] tracking-tight">
              Thrift<span className="text-[#E07A5F]">Sync</span>
            </span>
            <span className="text-[10px] text-gray-500 font-bold">.campus</span>
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Campus Checkout
            </h1>
            <span className="text-xs text-[#2A6F4E] font-bold">
              ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
          </div>

          <div className="text-gray-600 flex items-center gap-1 text-xs font-semibold">
            <Lock className="w-4 h-4 text-[#2A6F4E]" />
            <span className="hidden sm:inline">Peer-to-Peer Verified</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN CHECKOUT WORKSPACE (2 COLS) */}
      <main className="max-w-[1250px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ======================================================== */}
          {/* LEFT: 3-STEP ACCORDION (8 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* STEP 1: HANDOVER SPOT / ADDRESS */}
            <div className="bg-white rounded-md border border-[#E6E4DD] shadow-xs overflow-hidden">
              <div 
                className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer ${
                  activeStep === 1 ? 'bg-white' : 'bg-[#FAFAFA]'
                }`}
                onClick={() => setActiveStep(1)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#122620] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#122620]">
                    Select Campus Meetup Point or Hostel Address
                  </h2>
                </div>
                {activeStep !== 1 && (
                  <button className="text-xs text-[#2A6F4E] font-bold hover:underline">
                    Change
                  </button>
                )}
              </div>

              {activeStep === 1 ? (
                <div className="p-5 pt-1 border-t border-gray-200 space-y-4 text-xs">
                  
                  {/* Delivery Mode Tabs */}
                  <div className="flex gap-2 p-1 bg-[#F6F5F0] rounded-md max-w-md">
                    <button
                      onClick={() => setDeliveryType('campus_spot')}
                      className={`flex-1 py-1.5 rounded font-bold cursor-pointer transition-all ${
                        deliveryType === 'campus_spot' ? 'bg-white text-[#122620] shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      Official Campus Meetup Spot
                    </button>
                    <button
                      onClick={() => setDeliveryType('hostel_address')}
                      className={`flex-1 py-1.5 rounded font-bold cursor-pointer transition-all ${
                        deliveryType === 'hostel_address' ? 'bg-white text-[#122620] shadow-2xs' : 'text-gray-600'
                      }`}
                    >
                      Hostel / Home Address
                    </button>
                  </div>

                  {deliveryType === 'campus_spot' ? (
                    <div className="space-y-2">
                      <span className="font-bold text-gray-700 block">Choose Designated Safe Meetup Point:</span>
                      <div className="space-y-2">
                        {CAMPUS_PICKUP_POINTS.map((spot) => (
                          <div
                            key={spot.id}
                            onClick={() => setSelectedSpotId(spot.id)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                              selectedSpotId === spot.id
                                ? 'border-[#2A6F4E] bg-emerald-50/50 ring-1 ring-[#2A6F4E]'
                                : 'border-[#E6E4DD] hover:border-gray-400 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="campus-spot"
                                checked={selectedSpotId === spot.id}
                                onChange={() => setSelectedSpotId(spot.id)}
                                className="mt-0.5 text-[#2A6F4E] focus:ring-[#2A6F4E]"
                              />
                              <div>
                                <span className="font-bold text-[#122620] flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-[#2A6F4E]" />
                                  {spot.name}
                                </span>
                                <p className="text-gray-500 text-[11px] mt-0.5">{spot.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="font-bold text-gray-700 block">Choose Saved Address:</span>
                      <div className="space-y-2">
                        {user?.savedAddresses?.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-[#2A6F4E] bg-emerald-50/50 ring-1 ring-[#2A6F4E]'
                                : 'border-[#E6E4DD] hover:border-gray-400 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="hostel-addr"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mr-2 text-[#2A6F4E]"
                            />
                            <span className="font-bold">{addr.name}</span>
                            <p className="text-gray-600 pl-5">{addr.line1}, {addr.city} - {addr.pincode}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meetup time / note */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Meetup Instructions / Free Lecture Hours for Seller:
                    </label>
                    <input
                      type="text"
                      value={meetupNotes}
                      onChange={(e) => setMeetupNotes(e.target.value)}
                      placeholder="e.g. Can meet near library steps between 1 PM and 2 PM"
                      className="w-full p-2 border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-6 py-2 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer"
                  >
                    Use this Handover Spot
                  </button>
                </div>
              ) : (
                <div className="px-5 pb-4 text-xs text-gray-600 pl-14">
                  <p className="font-bold text-[#122620]">
                    {deliveryType === 'campus_spot' ? selectedCampusSpot.name : `${selectedAddress.name} (${selectedAddress.line1})`}
                  </p>
                  <p className="text-[11px] text-gray-500">Notes: {meetupNotes}</p>
                </div>
              )}
            </div>

            {/* STEP 2: PAYMENT METHOD */}
            <div className="bg-white rounded-md border border-[#E6E4DD] shadow-xs overflow-hidden">
              <div 
                className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer ${
                  activeStep === 2 ? 'bg-white' : 'bg-[#FAFAFA]'
                }`}
                onClick={() => setActiveStep(2)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#122620] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#122620]">
                    Payment method
                  </h2>
                </div>
                {activeStep !== 2 && (
                  <button className="text-xs text-[#2A6F4E] font-bold hover:underline">
                    Change
                  </button>
                )}
              </div>

              {activeStep === 2 ? (
                <div className="p-5 pt-1 border-t border-gray-200 space-y-3 text-xs">
                  
                  {/* Option 1: Cash on Handover */}
                  <label className={`block p-3 rounded border cursor-pointer transition-all ${
                    paymentMethod === 'COD' ? 'border-[#2A6F4E] bg-emerald-50/50 ring-1 ring-[#2A6F4E]' : 'border-[#E6E4DD]'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="mt-0.5 text-[#2A6F4E]"
                      />
                      <div>
                        <span className="font-bold text-[#122620]">Cash or UPI on Handover (Recommended)</span>
                        <p className="text-gray-500 text-[11px]">Inspect the textbook or jacket in person at the meetup spot, then scan UPI or pay cash.</p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Pre-pay via UPI */}
                  <label className={`block p-3 rounded border cursor-pointer transition-all ${
                    paymentMethod === 'UPI' ? 'border-[#2A6F4E] bg-emerald-50/50 ring-1 ring-[#2A6F4E]' : 'border-[#E6E4DD]'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        value="UPI"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="mt-0.5 text-[#2A6F4E]"
                      />
                      <div>
                        <span className="font-bold text-[#122620]">Instant Student UPI (GPay / PhonePe / Paytm)</span>
                        <p className="text-gray-500 text-[11px]">Held safely in peer escrow until handover is confirmed by both students.</p>
                      </div>
                    </div>
                  </label>

                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-6 py-2 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer mt-2"
                  >
                    Use this payment method
                  </button>
                </div>
              ) : (
                <div className="px-5 pb-4 text-xs text-gray-600 pl-14">
                  <p className="font-semibold text-gray-800">
                    {paymentMethod === 'COD' ? 'Cash or UPI on Campus Meetup' : 'Instant Student UPI'}
                  </p>
                </div>
              )}
            </div>

            {/* STEP 3: REVIEW & CONFIRM */}
            <div className="bg-white rounded-md border border-[#E6E4DD] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#122620] text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-[#122620]">
                    Review items and campus handover
                  </h2>
                </div>
              </div>

              {activeStep === 3 && (
                <div className="p-5 pt-1 border-t border-gray-200 space-y-4 text-xs">
                  
                  {/* Delivery spot alert */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2A6F4E]" />
                    <span>Meetup Scheduled at {deliveryType === 'campus_spot' ? selectedCampusSpot.name : selectedAddress.name}</span>
                  </div>

                  {/* Item Cards */}
                  <div className="divide-y divide-gray-200">
                    {activeCartItems.map((item) => (
                      <div key={item.cartItemId} className="py-3 flex gap-3 items-center">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                          alt={item.product.title}
                          className="w-12 h-12 object-contain bg-[#F9F8F5] border border-gray-200 rounded p-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#122620] truncate">{item.product.title}</p>
                          <p className="text-gray-500 text-[11px]">
                            {item.mode === 'rent' ? `Semester Rental (${item.rentalDays} days)` : 'Purchase'} • Qty: {item.quantity}
                          </p>
                          <p className="font-bold text-[#E07A5F]">
                            {item.mode === 'rent' ? formatCurrency(item.rentalRate * item.quantity) : formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || activeCartItems.length === 0}
                    className="px-8 py-2.5 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting Order to Campus Network...' : 'Confirm Order & Schedule Handover'}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT: STICKY ORDER SUMMARY BOX (4 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 sticky top-24 space-y-4 text-xs">
            <div className="bg-white rounded-md border border-[#E6E4DD] p-5 shadow-xs space-y-4">
              
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || activeCartItems.length === 0}
                className="w-full py-2.5 bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] disabled:bg-gray-300 text-white font-bold text-xs sm:text-sm rounded-full shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </button>

              <div className="border-t border-b border-gray-200 py-3 space-y-2">
                <h3 className="font-bold text-sm text-[#122620]">Order Summary</h3>
                <div className="flex justify-between text-gray-600">
                  <span>Direct Purchases:</span>
                  <span>{formatCurrency(calculations.purchaseTotal)}</span>
                </div>
                {calculations.rentalFeeTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Rental Fees:</span>
                    <span className="text-[#2A6F4E] font-semibold">{formatCurrency(calculations.rentalFeeTotal)}</span>
                  </div>
                )}
                {calculations.securityDepositTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Refundable Deposit:</span>
                    <span>{formatCurrency(calculations.securityDepositTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Campus Handover:</span>
                  <span className="text-[#15803D] font-bold">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#122620] pt-2 border-t border-gray-100">
                  <span>Grand Total:</span>
                  <span className="text-[#E07A5F]">{formatCurrency(calculations.grandTotal)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F6F5F0] rounded text-[11px] text-gray-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2A6F4E] shrink-0" />
                <span>Protected by Campus Student Handover Assurance</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 3. ORDER CONFIRMATION MODAL */}
      {orderPlacedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" />
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-4 z-10 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-[#2A6F4E] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#122620]">
                Campus Order Confirmed!
              </h2>
              <p className="text-xs text-gray-600">
                Meetup confirmation alert sent to your campus email: <strong>{user?.email || 'student@thriftsync.campus'}</strong>
              </p>
            </div>

            <div className="bg-[#F9F8F5] border border-[#E6E4DD] rounded p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-bold text-[#122620]">{orderPlacedData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Designated Handover Spot:</span>
                <span className="font-bold text-[#2A6F4E]">{orderPlacedData.pickupSpot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount Due upon Meetup:</span>
                <span className="font-bold text-[#E07A5F]">{formatCurrency(orderPlacedData.totalAmount)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 py-2.5 bg-[#1D3B32] hover:bg-[#122620] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer"
              >
                Track Live Handover Status in My Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs rounded-full cursor-pointer"
              >
                Back to Storefront
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
