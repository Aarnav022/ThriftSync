import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  PackageX, 
  Repeat, 
  BookOpen, 
  ShoppingBag, 
  Headphones, 
  Home as HomeIcon,
  Check,
  MapPin,
  Leaf
} from 'lucide-react';
import { fetchListings } from '../services/productService';
import { ProductCard } from '../components/marketplace/ProductCard';

const CATEGORIES = [
  'All Departments',
  'Textbooks',
  'Fashion',
  'Electronics',
  'Dorm & Living',
  'Other',
];

const CONDITIONS = ['All Conditions', 'Like New', 'Excellent', 'Good', 'Fair'];

const CAMPUS_ZONES = [
  'All Campuses',
  'North Campus Hub',
  'South Campus Hostel 4',
  'Central Administration'
];

export function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query parameters
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'All Departments';
  const sortParam = searchParams.get('sort') || 'featured';
  const dealsParam = searchParams.get('deals') === 'true';
  const listingTypeParam = searchParams.get('listingType') || 'all';
  const conditionParam = searchParams.get('condition') || 'All Conditions';

  // State
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedCondition, setSelectedCondition] = useState(conditionParam);
  const [selectedListingType, setSelectedListingType] = useState(listingTypeParam);
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(sortParam);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync with URL params
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
    if (listingTypeParam) setSelectedListingType(listingTypeParam);
    if (conditionParam) setSelectedCondition(conditionParam);
  }, [categoryParam, listingTypeParam, conditionParam]);

  // Fetch real listings
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const queryFilters = {};
    if (queryParam.trim()) queryFilters.search = queryParam.trim();
    if (selectedCategory && selectedCategory !== 'All Departments') queryFilters.category = selectedCategory;
    if (selectedCondition && selectedCondition !== 'All Conditions') queryFilters.condition = selectedCondition;
    if (selectedListingType && selectedListingType !== 'all') queryFilters.listingType = selectedListingType;

    fetchListings(queryFilters)
      .then((data) => {
        if (isMounted) setListings(data);
      })
      .catch((err) => console.error('Listing fetch failed:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [queryParam, selectedCategory, selectedCondition, selectedListingType]);

  const clearAllFilters = () => {
    setSelectedCategory('All Departments');
    setSelectedCondition('All Conditions');
    setSelectedListingType('all');
    setSelectedCampus('All Campuses');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('featured');
    setSearchParams({});
  };

  // Client-side refinement (Price, Stock, Sorting)
  const filteredProducts = useMemo(() => {
    let result = [...listings];

    // Price range
    const parsedMin = parseFloat(minPrice);
    const parsedMax = parseFloat(maxPrice);
    if (!isNaN(parsedMin)) {
      result = result.filter((p) => p.price >= parsedMin);
    }
    if (!isNaN(parsedMax)) {
      result = result.filter((p) => p.price <= parsedMax);
    }

    // Campus
    if (selectedCampus !== 'All Campuses') {
      result = result.filter((p) => (p.campus || '').toLowerCase() === selectedCampus.toLowerCase());
    }

    // In-stock
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    // Deals filter
    if (dealsParam) {
      result = result.filter((p) => p.discountPercentage >= 20 || p.price < 1500);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        // natural default
        break;
    }

    return result;
  }, [listings, minPrice, maxPrice, selectedCampus, inStockOnly, dealsParam, sortBy]);

  // Active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All Departments') count++;
    if (selectedCondition !== 'All Conditions') count++;
    if (selectedListingType !== 'all') count++;
    if (selectedCampus !== 'All Campuses') count++;
    if (minPrice || maxPrice) count++;
    if (inStockOnly) count++;
    if (dealsParam) count++;
    return count;
  }, [selectedCategory, selectedCondition, selectedListingType, selectedCampus, minPrice, maxPrice, inStockOnly, dealsParam]);

  const FilterPanel = (
    <div className="space-y-6 text-xs text-[#122620]">
      
      {/* Exchange Type (Buy vs Rent) */}
      <div>
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#2A6F4E] mb-2 flex items-center gap-1">
          <Repeat className="w-3.5 h-3.5" />
          <span>Exchange Type</span>
        </h3>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'All Items (Buy & Rent)' },
            { id: 'buy', label: 'Outright Purchase Only' },
            { id: 'rent', label: 'Semester Rentals Only' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedListingType(type.id)}
              className={`w-full text-left py-1.5 px-2 rounded transition-all cursor-pointer ${
                selectedListingType === type.id
                  ? 'bg-[#1D3B32] text-white font-bold'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department Filter */}
      <div>
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#2A6F4E] mb-2">
          Department
        </h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left py-1 px-2 rounded transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'font-bold text-[#E07A5F] bg-[#F6F5F0]'
                  : 'hover:text-[#2A6F4E] text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Condition Filter */}
      <div>
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#2A6F4E] mb-2">
          Item Condition
        </h3>
        <div className="space-y-1">
          {CONDITIONS.map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`w-full text-left py-1 px-2 rounded transition-all cursor-pointer ${
                selectedCondition === cond
                  ? 'font-bold text-[#2A6F4E] bg-emerald-50'
                  : 'hover:text-[#2A6F4E] text-gray-700'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Campus Zone Filter */}
      <div>
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#2A6F4E] mb-2 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>Campus Meetup Zone</span>
        </h3>
        <div className="space-y-1">
          {CAMPUS_ZONES.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedCampus(zone)}
              className={`w-full text-left py-1 px-2 rounded transition-all cursor-pointer ${
                selectedCampus === zone
                  ? 'font-bold text-[#1D3B32] bg-gray-100'
                  : 'hover:text-[#2A6F4E] text-gray-700'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Student Budget Price Range */}
      <div>
        <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#2A6F4E] mb-2">
          Student Budget Price (₹)
        </h3>
        
        {/* Quick Student Price Filters */}
        <div className="flex flex-col gap-1 mb-2.5">
          <button
            onClick={() => { setMinPrice(''); setMaxPrice('150'); }}
            className={`text-left text-xs px-2 py-1 rounded transition-colors ${
              maxPrice === '150' && !minPrice ? 'font-bold text-[#E07A5F] bg-amber-50' : 'text-gray-700 hover:text-[#2A6F4E]'
            }`}
          >
            Under ₹150
          </button>
          <button
            onClick={() => { setMinPrice('150'); setMaxPrice('300'); }}
            className={`text-left text-xs px-2 py-1 rounded transition-colors ${
              minPrice === '150' && maxPrice === '300' ? 'font-bold text-[#E07A5F] bg-amber-50' : 'text-gray-700 hover:text-[#2A6F4E]'
            }`}
          >
            ₹150 - ₹300
          </button>
          <button
            onClick={() => { setMinPrice('300'); setMaxPrice('500'); }}
            className={`text-left text-xs px-2 py-1 rounded transition-colors ${
              minPrice === '300' && maxPrice === '500' ? 'font-bold text-[#E07A5F] bg-amber-50' : 'text-gray-700 hover:text-[#2A6F4E]'
            }`}
          >
            ₹300 - ₹500
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            placeholder="Min"
            min="0"
            max="1000"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706]"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="number"
            placeholder="Max"
            min="0"
            max="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2 py-1.5 border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706]"
          />
        </div>
        <p className="text-[10px] text-gray-500">Affordable peer exchange (capped at ₹1,000)</p>
      </div>

      {/* In Stock Only */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-[#2A6F4E]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded text-[#2A6F4E] focus:ring-[#2A6F4E] cursor-pointer"
          />
          <span>In Stock / Available for Handover</span>
        </label>
      </div>

      {/* Reset */}
      {activeCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-1.5 bg-[#F6F5F0] hover:bg-gray-200 border border-[#E6E4DD] rounded font-bold text-[#122620] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}

    </div>
  );

  return (
    <div className="space-y-4 pb-12 select-none">
      
      {/* 1. TOP UTILITY BAR */}
      <div className="bg-white px-4 py-3 rounded-md border border-[#E6E4DD] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm text-[#122620]">
            <span className="font-bold">1-{filteredProducts.length}</span> of {filteredProducts.length} campus listings
            {queryParam && (
              <span> for <strong className="text-[#E07A5F]">"{queryParam}"</strong></span>
            )}
            {selectedCategory !== 'All Departments' && (
              <span> in <strong>{selectedCategory}</strong></span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 border border-[#E6E4DD] rounded bg-[#F6F5F0] hover:bg-gray-200 text-xs font-bold text-[#122620] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="bg-[#E07A5F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#122620]">
            <span className="hidden sm:inline text-gray-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#F6F5F0] hover:bg-gray-200 border border-[#E6E4DD] rounded px-2.5 py-1.5 text-xs font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-[#D97706]"
            >
              <option value="featured">Featured Campus Items</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated Sellers</option>
              <option value="newest">Recently Listed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN VIEW */}
      <div className="flex gap-5 items-start">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[240px] shrink-0 bg-white p-4 rounded-md border border-[#E6E4DD] shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
            <h2 className="font-bold text-sm text-[#122620] flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#2A6F4E]" />
              <span>Campus Filters</span>
            </h2>
            {activeCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-[#2A6F4E] hover:underline font-bold cursor-pointer"
              >
                Clear all ({activeCount})
              </button>
            )}
          </div>
          {FilterPanel}
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-md border border-[#E6E4DD] p-12 text-center space-y-4 shadow-xs">
              <PackageX className="w-14 h-14 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#122620]">
                  No matching campus items found
                </h2>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Try broadening your search query, clearing price boundaries, or checking another department.
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2 bg-[#E07A5F] hover:bg-[#C86449] text-white text-xs font-bold rounded-full cursor-pointer shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-[85%] max-w-[320px] bg-white h-full ml-auto shadow-2xl flex flex-col z-10 overflow-hidden">
            <div className="bg-[#1D3B32] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#E07A5F]" /> Filter Campus Listings
              </span>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {FilterPanel}
            </div>
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2 border border-gray-300 rounded text-xs font-bold bg-white"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2 bg-[#E07A5F] text-white rounded text-xs font-bold"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
