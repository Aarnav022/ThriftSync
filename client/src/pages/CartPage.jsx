import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Repeat,
  MapPin,
  Leaf
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

export function CartPage() {
  const navigate = useNavigate();
  const { 
    activeCartItems, 
    savedForLaterItems, 
    totalItemCount, 
    subtotal, 
    calculations,
    removeFromCart, 
    updateQuantity, 
    saveForLater, 
    moveToCart 
  } = useCart();

  return (
    <div className="space-y-6 pb-16 select-none">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: ACTIVE CART & SAVED FOR LATER (8 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Cart Container */}
          <div className="bg-white rounded-md border border-[#E6E4DD] p-4 sm:p-6 shadow-xs">
            <div className="flex items-baseline justify-between pb-3 border-b border-gray-200">
              <h1 className="text-xl sm:text-2xl font-bold text-[#122620]">
                Campus Shopping Bag
              </h1>
              <span className="hidden sm:inline text-xs text-gray-500 font-semibold">
                Price / Rental
              </span>
            </div>

            {/* Empty Cart */}
            {activeCartItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-16 h-16 bg-[#F6F5F0] rounded-full flex items-center justify-center mx-auto text-[#2A6F4E]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#122620]">
                    Your campus cart is empty
                  </h2>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Explore student textbooks, pre-loved streetwear, semester rentals, and study tech on campus.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Browse Campus Listings</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Items List */
              <div className="divide-y divide-gray-200">
                {activeCartItems.map((item) => {
                  const { product, quantity, mode, rentalDays, rentalRate, deposit, cartItemId } = item;
                  const maxStock = product.stockCount || 5;

                  const linePrice = mode === 'rent'
                    ? ((rentalRate || 100) * quantity)
                    : ((product.price || 0) * quantity);

                  return (
                    <div key={cartItemId} className="py-5 flex flex-col sm:flex-row gap-4 items-start">
                      
                      {/* Image */}
                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="w-24 h-24 sm:w-28 sm:h-28 bg-[#F9F8F5] rounded border border-gray-200 p-2 shrink-0 flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <Link
                              to={`/product/${product.id || product._id}`}
                              className="text-sm font-semibold text-[#122620] hover:text-[#2A6F4E] line-clamp-2 leading-snug"
                            >
                              {product.title}
                            </Link>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Condition: <span className="font-semibold text-gray-700">{product.condition}</span> • Listed by {product.seller?.name || 'Campus Student'}
                            </p>
                          </div>

                          {/* Line Price */}
                          <div className="text-right shrink-0">
                            <span className="text-base font-bold text-[#122620]">
                              {formatCurrency(linePrice)}
                            </span>
                            {mode === 'rent' && (
                              <p className="text-[10px] text-emerald-800 font-semibold">
                                (+{formatCurrency(deposit * quantity)} deposit)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Mode & Pickup Info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {mode === 'rent' ? (
                            <span className="bg-emerald-50 text-[#2A6F4E] border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                              <Repeat className="w-3 h-3" /> Semester Rental ({rentalDays} days)
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-[#122620] px-2 py-0.5 rounded text-[11px] font-bold">
                              Outright Purchase
                            </span>
                          )}

                          <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#E07A5F]" />
                            {product.pickupLocation || 'Student Center Desk'}
                          </span>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <div className="flex items-center border border-gray-300 rounded bg-[#F6F5F0] px-2 py-0.5">
                            <label className="text-[11px] text-gray-600 mr-1.5 font-medium">Qty:</label>
                            <select
                              value={quantity}
                              onChange={(e) => updateQuantity(cartItemId, Number(e.target.value), maxStock)}
                              className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                            >
                              {[...Array(Math.min(10, maxStock))].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-gray-300">|</span>

                          <button
                            onClick={() => removeFromCart(cartItemId)}
                            className="text-[#2A6F4E] hover:text-[#122620] hover:underline font-semibold cursor-pointer"
                          >
                            Delete
                          </button>

                          <span className="text-gray-300">|</span>

                          <button
                            onClick={() => saveForLater(cartItemId)}
                            className="text-[#2A6F4E] hover:text-[#122620] hover:underline font-semibold cursor-pointer"
                          >
                            Save for later
                          </button>
                        </div>

                      </div>

                    </div>
                  );
                })}

                {/* Subtotal Footer */}
                <div className="pt-4 text-right text-sm text-[#122620]">
                  <span>Subtotal ({totalItemCount} items): </span>
                  <span className="text-lg font-bold text-[#E07A5F]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Saved for Later Section */}
          <div className="bg-white rounded-md border border-[#E6E4DD] p-4 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#122620] pb-2 border-b border-gray-200">
              Saved for later ({savedForLaterItems.length} items)
            </h2>

            {savedForLaterItems.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">
                No items saved for later. Items you move here will be kept safe for future semesters.
              </p>
            ) : (
              <div className="divide-y divide-gray-200">
                {savedForLaterItems.map((item) => {
                  const { product, cartItemId } = item;
                  return (
                    <div key={cartItemId} className="py-4 flex gap-4 items-start">
                      <Link
                        to={`/product/${product.id || product._id}`}
                        className="w-16 h-16 bg-[#F9F8F5] rounded border border-gray-200 p-1 shrink-0 flex items-center justify-center"
                      >
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </Link>
                      <div className="flex-1 space-y-1 text-xs">
                        <Link
                          to={`/product/${product.id || product._id}`}
                          className="font-semibold text-[#122620] hover:text-[#2A6F4E] line-clamp-1"
                        >
                          {product.title}
                        </Link>
                        <p className="font-bold text-[#E07A5F] text-sm">
                          {formatCurrency(product.price)}
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            onClick={() => moveToCart(cartItemId)}
                            className="px-3 py-1 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold rounded-full text-xs cursor-pointer shadow-2xs"
                          >
                            Move to Bag
                          </button>
                          <button
                            onClick={() => removeFromCart(cartItemId)}
                            className="text-[#2A6F4E] hover:underline font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: STICKY SUBTOTAL CARD (4 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-md border border-[#E6E4DD] p-5 shadow-xs space-y-3.5 text-xs">
            
            {/* Campus Free Handover Notification */}
            <div className="flex items-start gap-2 text-[#2A6F4E] bg-emerald-50 p-2.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-[#2A6F4E] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-xs">Campus Handover is Free of Charge!</span>
                <p className="text-[11px] text-emerald-800">
                  Pick up at library entrance or hostel desk with peer verification.
                </p>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 py-2 border-t border-b border-gray-200">
              <div className="flex justify-between text-gray-700">
                <span>Direct Purchases ({totalItemCount} items):</span>
                <span className="font-semibold">{formatCurrency(calculations.purchaseTotal)}</span>
              </div>

              {calculations.rentalFeeTotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Semester Rental Fees:</span>
                  <span className="font-semibold text-emerald-800">{formatCurrency(calculations.rentalFeeTotal)}</span>
                </div>
              )}

              {calculations.securityDepositTotal > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-semibold text-[#1D3B32]">{formatCurrency(calculations.securityDepositTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-[#122620] pt-2 border-t border-gray-100">
                <span>Subtotal:</span>
                <span className="text-[#E07A5F]">{formatCurrency(calculations.subtotal)}</span>
              </div>
            </div>

            {/* Proceed to Buy CTA (Warm Terracotta) */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={activeCartItems.length === 0}
              className="w-full py-2.5 px-4 bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Campus Checkout ({totalItemCount} items)</span>
            </button>

            {/* Sustainability Impact Tag */}
            <div className="p-2.5 bg-[#F6F5F0] rounded text-[11px] text-gray-600 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#2A6F4E] shrink-0" />
              <span>By buying thrifted and renting on campus, you divert ~4.2 kg of landfill waste!</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
