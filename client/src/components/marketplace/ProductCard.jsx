import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check, ShoppingCart, Repeat, MapPin } from 'lucide-react';
import { StarRating } from '../common/StarRating';
import { PriceBlock } from '../common/PriceBlock';
import { ConditionBadge } from '../common/ConditionBadge';
import { PrimeBadge } from '../common/PrimeBadge';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAdded, setIsAdded] = useState(false);

  const isFavorited = isInWishlist(product.id || product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, { mode: 'buy' });
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group bg-white border border-[#E6E4DD] hover:border-[#B8B5AA] rounded-xs flex flex-col justify-between p-3.5 transition-all duration-200 hover:shadow-md relative text-left select-none">
      
      {/* Top Meta: Condition & Wishlist */}
      <div className="flex items-start justify-between min-h-[24px] mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ConditionBadge condition={product.condition} size="xs" />
          {product.listingType === 'buy_and_rent' && (
            <span className="bg-[#1D3B32]/10 text-[#1D3B32] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Repeat className="w-2.5 h-2.5" /> Buy / Rent
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleToggleWishlist}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10 cursor-pointer"
          aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Product Image */}
      <Link
        to={`/product/${product.id || product._id}`}
        className="block relative aspect-square w-full mb-3 overflow-hidden rounded bg-[#F9F8F5] flex items-center justify-center p-2"
      >
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Main Details */}
      <div className="flex-1 flex flex-col">
        {/* Campus & Department */}
        <div className="flex items-center justify-between text-[11px] text-[#5C635E] font-medium uppercase tracking-wider mb-1">
          <span className="truncate">{product.category}</span>
          <span className="flex items-center gap-0.5 text-[#2A6F4E] font-semibold">
            <MapPin className="w-3 h-3" /> {product.campus || 'Campus'}
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.id || product._id}`}
          className="text-xs sm:text-[13px] font-medium text-[#122620] hover:text-[#2A6F4E] line-clamp-2 leading-snug mb-1.5 transition-colors"
          title={product.title}
        >
          {product.title}
        </Link>

        {/* Rating and Reviews */}
        <div className="mb-2">
          <StarRating rating={product.rating || 4.8} reviewCount={product.reviewCount || 12} size="xs" />
        </div>

        {/* Price Block */}
        <div className="mb-2">
          <PriceBlock
            price={product.price}
            originalPrice={product.originalPrice}
            discountPercentage={product.discountPercentage}
            rentalRate={product.isRentable ? product.rentalRate : null}
            rentalPeriod={product.rentalPeriod}
            size="sm"
          />
        </div>

        {/* Campus Handover Location */}
        <div className="text-[11px] text-[#5C635E] space-y-0.5 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PrimeBadge size="sm" />
            <span className="font-semibold text-[#122620]">
              Handover: {product.pickupLocation || 'Student Center'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Warm Terracotta Primary CTA */}
      <div className="pt-1">
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAdded}
          className={`w-full py-1.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
            isAdded
              ? 'bg-[#1D3B32] text-white'
              : !product.inStock
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] text-white'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Added to Cart</span>
            </>
          ) : !product.inStock ? (
            <span>Out of Stock</span>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
