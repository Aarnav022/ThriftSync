import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Lock, 
  Heart, 
  Check, 
  ShoppingCart, 
  Zap, 
  ChevronRight, 
  Share2, 
  ThumbsUp, 
  Repeat, 
  UserCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { fetchListingById, fetchListings } from '../services/productService';
import { submitReview } from '../services/reviewService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/common/StarRating';
import { PriceBlock } from '../components/common/PriceBlock';
import { ConditionBadge } from '../components/common/ConditionBadge';
import { PrimeBadge } from '../components/common/PrimeBadge';
import { ProductCard } from '../components/marketplace/ProductCard';
import { formatCurrency } from '../utils/formatters';

const RENTAL_DURATIONS = [
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
];

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, isAuthenticated, deliveryLocation } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery & Options
  const [selectedImage, setSelectedImage] = useState(0);
  const [mode, setMode] = useState('buy'); // 'buy' | 'rent'
  const [rentalDays, setRentalDays] = useState(7);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  // Review Form
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Load Product Data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchListingById(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        if (data?.listingType === 'rent') setMode('rent');
        else setMode('buy');

        // Fetch related items from the same category
        if (data?.category) {
          fetchListings({ category: data.category }).then((all) => {
            if (isMounted) {
              setRelatedProducts(all.filter((p) => (p.id || p._id) !== id).slice(0, 4));
            }
          });
        }
      })
      .catch((err) => console.error('Failed to load PDP:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  if (isLoading || !product) {
    return (
      <div className="bg-white rounded-md border border-[#E6E4DD] p-12 text-center space-y-3 my-6">
        <div className="w-8 h-8 border-3 border-[#2A6F4E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500 font-semibold">Loading campus listing details...</p>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id || product._id);
  const maxStock = product.stockCount || 1;

  // Rental math
  const dailyRate = Math.round((product.rentalRate || 100) / 7);
  const calculatedRentalCost = dailyRate * rentalDays * quantity;
  const totalDeposit = (product.deposit || 300) * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, {
      mode,
      rentalDays: mode === 'rent' ? rentalDays : null,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, {
      mode,
      rentalDays: mode === 'rent' ? rentalDays : null,
    });
    navigate('/checkout');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      await submitReview({
        listingId: product.id || product._id,
        targetUserId: product.seller?._id || product.seller?.id,
        rating: reviewRating,
        reviewText: reviewComment.trim(),
        transactionType: mode === 'rent' ? 'RENTAL' : 'PURCHASE',
        transactionId: product.id || product._id,
      });
    } catch (err) {
      console.warn('Review submission fallback:', err?.message);
    }

    // Immediately push to local reviews state for instant optimistic UI feedback
    const newRev = {
      id: 'rev-' + Date.now(),
      author: user?.name || 'Verified Student',
      rating: reviewRating,
      date: 'Just now',
      title: 'Verified Campus Feedback',
      content: reviewComment.trim(),
      verifiedPurchase: true,
      helpfulCount: 1,
    };
    product.reviews = [newRev, ...(product.reviews || [])];
    product.reviewCount = (product.reviewCount || 0) + 1;

    setReviewSuccess(true);
    setReviewComment('');
    setTimeout(() => {
      setIsReviewOpen(false);
      setReviewSuccess(false);
    }, 1500);
  };

  // 5-to-1 star breakdown distribution
  const ratingDistribution = [
    { stars: 5, pct: 75 },
    { stars: 4, pct: 18 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
  ];

  return (
    <div className="space-y-6 pb-20 select-none">
      
      {/* 1. BREADCRUMBS */}
      <nav className="text-xs text-[#5C635E] flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-[#2A6F4E] hover:underline">Campus Home</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link 
          to={`/products?category=${encodeURIComponent(product.category)}`}
          className="hover:text-[#2A6F4E] hover:underline"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-400">{product.condition}</span>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-[#122620] font-medium truncate max-w-[280px] sm:max-w-md">
          {product.title}
        </span>
      </nav>

      {/* 2. 3-COLUMN PDP GRID */}
      <div className="bg-white rounded-md border border-[#E6E4DD] p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: IMAGE GALLERY (40% - 5 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 sticky top-24">
            
            {/* Vertical Thumbnails */}
            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto no-scrollbar shrink-0">
              {product.images?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  onMouseEnter={() => setSelectedImage(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded border p-1 bg-white shrink-0 transition-all cursor-pointer ${
                    selectedImage === idx
                      ? 'border-[#2A6F4E] ring-2 ring-[#2A6F4E]/30 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>

            {/* Main Preview Image */}
            <div className="flex-1 relative aspect-square bg-[#F9F8F5] rounded flex items-center justify-center p-4 border border-gray-100 group overflow-hidden">
              <img
                src={product.images?.[selectedImage] || product.images?.[0]}
                alt={product.title}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110 cursor-crosshair"
              />

              {/* Condition Badge in top-left */}
              <div className="absolute top-3 left-3 space-y-1">
                <ConditionBadge condition={product.condition} size="sm" />
              </div>

              {/* Wishlist & Share in top-right */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white shadow text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/90 hover:bg-white shadow text-gray-500 hover:text-[#2A6F4E] transition-colors cursor-pointer"
                  title="Share link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {showShareNotification && (
                <div className="absolute bottom-3 inset-x-4 bg-[#122620] text-white text-xs py-2 px-3 rounded shadow-lg text-center animate-in fade-in">
                  Link copied to clipboard!
                </div>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* CENTER COLUMN: DETAILS & SPECS (35% - 4 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-4 text-[#122620]">
            
            {/* Title & Seller Info */}
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/products?category=${encodeURIComponent(product.category)}`}
                  className="text-xs text-[#2A6F4E] hover:underline font-bold"
                >
                  {product.category}
                </Link>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-[#5C635E]">Listed by {product.seller?.name || 'Campus Peer'}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#122620] leading-snug mt-1">
                {product.title}
              </h1>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
              <span className="text-xs font-bold">{product.rating}</span>
              <StarRating rating={product.rating} showCount={false} size="sm" />
              <span className="text-xs text-[#2A6F4E] hover:underline cursor-pointer">
                {Number(product.reviewCount || 1).toLocaleString('en-IN')} verified peer ratings
              </span>
            </div>

            {/* Price Block */}
            <div className="space-y-1 pb-3 border-b border-gray-200">
              <PriceBlock
                price={product.price}
                originalPrice={product.originalPrice}
                discountPercentage={product.discountPercentage}
                rentalRate={product.isRentable ? product.rentalRate : null}
                rentalPeriod={product.rentalPeriod}
                size="lg"
              />
              <p className="text-xs text-[#5C635E]">Zero platform service markup for enrolled students</p>
            </div>

            {/* Campus Meetup Guarantee Box */}
            <div className="border border-[#E6E4DD] rounded-md p-3.5 bg-[#F6F5F0] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#122620]">
                <MapPin className="w-4 h-4 text-[#E07A5F]" />
                <span>Campus Handover Location</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Designated safe pickup zone: <strong className="text-[#122620]">{product.pickupLocation || 'Central Library Entrance'}</strong> ({product.campus || 'North Campus'}).
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#2A6F4E] font-semibold pt-1">
                <ShieldCheck className="w-4 h-4 text-[#2A6F4E]" />
                <span>Inspect in person before paying • No shipping delay</span>
              </div>
            </div>

            {/* "About this item" Bullet Points */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-sm text-[#122620]">About this campus item</h3>
              <ul className="space-y-1.5 text-xs text-gray-800 list-disc list-outside pl-4 leading-relaxed">
                {product.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Specifications Table */}
            {product.specifications && (
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <h3 className="font-bold text-sm text-[#122620]">Specifications & History</h3>
                <div className="border border-gray-200 rounded overflow-hidden text-xs">
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <div
                      key={key}
                      className={`grid grid-cols-2 p-2 ${
                        idx % 2 === 0 ? 'bg-[#F9F8F5]' : 'bg-white'
                      }`}
                    >
                      <span className="font-semibold text-gray-600">{key}</span>
                      <span className="text-[#122620]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: STICKY BUY / RENT BOX (25% - 3 COLS) */}
          {/* ======================================================== */}
          <div className="lg:col-span-3 sticky top-24">
            <div className="border border-[#E6E4DD] rounded-md p-4 bg-white shadow-xs space-y-3.5 text-xs">
              
              {/* BUY VS RENT TABS SELECTOR (If Rentable) */}
              {product.isRentable && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F5F0] rounded-md border border-[#E6E4DD]">
                  <button
                    onClick={() => setMode('buy')}
                    className={`py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                      mode === 'buy'
                        ? 'bg-white text-[#122620] shadow-2xs'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Buy Outright
                  </button>
                  <button
                    onClick={() => setMode('rent')}
                    className={`py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                      mode === 'rent'
                        ? 'bg-[#1D3B32] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Rent for Semester
                  </button>
                </div>
              )}

              {/* Mode Breakdown */}
              {mode === 'rent' ? (
                <div className="space-y-2 p-2.5 bg-emerald-50/60 rounded border border-emerald-200 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600">Rental Charge:</span>
                    <span className="font-bold text-sm text-[#122620]">
                      {formatCurrency(calculatedRentalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600">Refundable Deposit:</span>
                    <span className="font-semibold text-emerald-800">
                      +{formatCurrency(totalDeposit)}
                    </span>
                  </div>

                  {/* Duration Selector */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Choose Rental Duration:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {RENTAL_DURATIONS.map((dur) => (
                        <button
                          key={dur.days}
                          onClick={() => setRentalDays(dur.days)}
                          className={`py-1 px-2 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                            rentalDays === dur.days
                              ? 'border-[#2A6F4E] bg-white text-[#2A6F4E] ring-1 ring-[#2A6F4E]'
                              : 'border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-[#E07A5F]">
                  {formatCurrency(product.price * quantity)}
                </div>
              )}

              {/* Location Delivery Pin */}
              <div className="flex items-center gap-1 text-[#2A6F4E] hover:text-[#122620] cursor-pointer pt-1 border-t border-gray-100">
                <MapPin className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                <span className="truncate">
                  Pickup: {product.pickupLocation || deliveryLocation.pickupSpot}
                </span>
              </div>

              {/* Stock Status */}
              <div>
                {product.inStock && maxStock > 0 ? (
                  <div>
                    <span className="text-sm font-bold text-[#15803D] block">In Stock</span>
                    {maxStock <= 4 && (
                      <span className="text-[11px] text-[#B91C1C] font-semibold">
                        Only {maxStock} left in stock - claim yours now.
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[#B91C1C]">Currently Unavailable</span>
                )}
              </div>

              {/* Quantity Selector */}
              {product.inStock && maxStock > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="pdp-qty" className="font-semibold text-gray-700">Quantity:</label>
                  <select
                    id="pdp-qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-[#E6E4DD] bg-[#F6F5F0] rounded px-2.5 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-[#D97706]"
                  >
                    {[...Array(Math.min(10, maxStock))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CTA BUTTONS */}
              <div className="space-y-2 pt-1">
                {/* Primary CTA (Terracotta) */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || maxStock <= 0 || isAdded}
                  className={`w-full py-2 px-4 rounded-full font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAdded
                      ? 'bg-[#1D3B32] text-white'
                      : !product.inStock
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{mode === 'rent' ? 'Add Rental to Bag' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>

                {/* Secondary CTA (Botanical Green) */}
                <button
                  onClick={handleBuyNow}
                  disabled={!product.inStock || maxStock <= 0}
                  className="w-full py-2 px-4 bg-[#1D3B32] hover:bg-[#122620] active:bg-[#0D1A16] text-white font-bold text-xs rounded-full shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-[#E07A5F]" />
                  <span>{mode === 'rent' ? 'Rent Now' : 'Buy Now'}</span>
                </button>
              </div>

              {/* Handover & Security Note */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[11px] text-[#5C635E]">
                <div className="flex items-center gap-1.5 text-gray-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2A6F4E]" />
                  <span>Campus Safe Transaction</span>
                </div>
                <div className="grid grid-cols-2">
                  <span>Seller Peer</span>
                  <span className="text-[#122620] font-semibold">{product.seller?.name || 'Verified Student'}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span>Payment Mode</span>
                  <span className="text-[#122620] font-semibold">Cash or UPI upon Meetup</span>
                </div>
              </div>

              {/* Wishlist Link */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => toggleWishlist(product)}
                  className="w-full py-1.5 text-xs text-center border border-gray-300 rounded bg-[#F9F8F5] hover:bg-gray-100 text-[#122620] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{isFavorited ? 'Saved in Wishlist' : 'Add to Campus Wishlist'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. RELATED CAMPUS PRODUCTS CAROUSEL */}
      {relatedProducts.length > 0 && (
        <div className="bg-white rounded-md border border-[#E6E4DD] p-5 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-[#122620] mb-3">
            More from {product.category} in Your Campus Zone
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id || rel._id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* 4. CUSTOMER REVIEWS & RATINGS BREAKDOWN */}
      <div className="bg-white rounded-md border border-[#E6E4DD] p-6 shadow-xs">
        <h2 className="text-xl font-bold text-[#122620] mb-6">Verified Student Reviews</h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Summary & Write Review Button */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} showCount={false} size="lg" />
              <span className="text-xl font-black text-[#122620]">
                {product.rating} out of 5
              </span>
            </div>
            <p className="text-xs text-[#5C635E]">
              {Number(product.reviewCount || 12).toLocaleString('en-IN')} campus ratings
            </p>

            {/* Percentage Bars */}
            <div className="space-y-2 pt-2 text-xs">
              {ratingDistribution.map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3 text-[#2A6F4E] hover:underline cursor-pointer">
                  <span className="w-12 shrink-0">{stars} star</span>
                  <div className="flex-1 h-3.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D97706] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600">{pct}%</span>
                </div>
              ))}
            </div>

            {/* Write a Review Button */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <h4 className="font-bold text-sm text-[#122620]">Met this seller?</h4>
              <p className="text-xs text-gray-600">Share your handover feedback with the campus community.</p>
              <button
                onClick={() => setIsReviewOpen(!isReviewOpen)}
                className="w-full py-2 border border-[#2A6F4E] text-[#2A6F4E] hover:bg-emerald-50 rounded-full text-xs font-bold shadow-2xs cursor-pointer transition-colors"
              >
                Write a Student Review
              </button>
            </div>

            {/* Interactive Review Dialog */}
            {isReviewOpen && (
              <form onSubmit={handleReviewSubmit} className="p-4 bg-[#F6F5F0] rounded-md border border-[#E6E4DD] space-y-3 animate-in fade-in text-xs">
                <span className="font-bold text-[#122620] block">Your Rating</span>
                <div className="flex items-center gap-1.5 text-[#D97706]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${s <= reviewRating ? 'fill-[#D97706]' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-gray-700 ml-2">({reviewRating}/5 Stars)</span>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Feedback</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe item condition, punctuality at library desk, communication..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#D97706] bg-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold rounded-full cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Submit Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {reviewSuccess && (
                  <p className="text-xs text-emerald-700 font-bold">Review submitted successfully!</p>
                )}
              </form>
            )}
          </div>

          {/* Right Verified Reviews List */}
          <div className="md:col-span-8 space-y-5 divide-y divide-gray-200">
            {product.reviews?.map((rev) => (
              <div key={rev.id || rev._id} className="pt-4 first:pt-0 space-y-2 text-xs text-[#122620]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1D3B32] text-white flex items-center justify-center font-bold text-xs">
                    {(rev.author || 'S').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-sm block">{rev.author || 'Verified Student'}</span>
                    <span className="text-[10px] text-gray-500">{rev.date || 'Campus Member'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={rev.rating} showCount={false} size="xs" />
                  <span className="font-bold text-xs">{rev.title}</span>
                </div>

                {rev.verifiedPurchase && (
                  <span className="inline-block text-[#2A6F4E] font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified Campus Handover
                  </span>
                )}

                <p className="text-xs text-gray-800 leading-relaxed">
                  {rev.content || rev.reviewText}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-[#5C635E]">
                  <span>{rev.helpfulCount || 2} students found this helpful</span>
                  <button
                    onClick={() => alert("Marked as helpful!")}
                    className="px-3 py-1 border border-gray-300 rounded-full shadow-2xs hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 5. MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-300 p-2.5 shadow-2xl flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs text-[#5C635E]">{mode === 'rent' ? 'Rental Total' : 'Price'}</span>
          <span className="text-sm font-bold text-[#E07A5F]">
            {mode === 'rent' ? formatCurrency(calculatedRentalCost) : formatCurrency(product.price * quantity)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || maxStock <= 0 || isAdded}
            className="flex-1 py-2 px-3 bg-[#E07A5F] active:bg-[#C86449] text-white font-bold text-xs rounded-full shadow-xs flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!product.inStock || maxStock <= 0}
            className="flex-1 py-2 px-3 bg-[#1D3B32] active:bg-[#122620] text-white font-bold text-xs rounded-full shadow-xs flex items-center justify-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-[#E07A5F]" />
            <span>{mode === 'rent' ? 'Rent' : 'Buy'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
