import React from 'react';

export function PriceBlock({ price, originalPrice, discountPercentage, rentalRate, rentalPeriod, size = 'md' }) {
  const formattedPrice = Number(price || 0).toLocaleString('en-IN');
  const formattedOriginal = originalPrice ? Number(originalPrice).toLocaleString('en-IN') : null;

  if (size === 'lg') {
    return (
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          {discountPercentage > 0 && (
            <span className="text-2xl font-bold text-[#B91C1C]">
              -{discountPercentage}%
            </span>
          )}
          <div className="flex items-start text-[#122620] font-black">
            <span className="text-xs pt-1">₹</span>
            <span className="text-3xl leading-none">{formattedPrice}</span>
          </div>
        </div>

        {formattedOriginal && (
          <div className="text-xs text-[#5C635E]">
            <span>Campus MRP: </span>
            <span className="line-through">₹{formattedOriginal}</span>
          </div>
        )}

        {rentalRate && (
          <div className="text-xs text-[#2A6F4E] font-bold flex items-center gap-1 pt-0.5">
            <span>or Rent at ₹{rentalRate}/{rentalPeriod || 'week'}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <div className="flex items-start text-[#122620] font-bold">
          <span className="text-[10px] pt-0.5 font-normal">₹</span>
          <span className="text-base sm:text-lg leading-none">{formattedPrice}</span>
        </div>
        {formattedOriginal && (
          <span className="text-xs text-[#5C635E] line-through">
            ₹{formattedOriginal}
          </span>
        )}
        {discountPercentage > 0 && (
          <span className="text-[11px] font-bold text-[#B91C1C]">
            ({discountPercentage}% off)
          </span>
        )}
      </div>

      {rentalRate && (
        <div className="text-[11px] text-[#2A6F4E] font-semibold">
          or rent for ₹{rentalRate}/{rentalPeriod || 'wk'}
        </div>
      )}
    </div>
  );
}
