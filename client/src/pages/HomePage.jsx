import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Repeat, 
  Leaf, 
  MapPin,
  ArrowRight,
  BookOpen,
  ShoppingBag,
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { fetchListings } from '../services/productService';
import { ProductCard } from '../components/marketplace/ProductCard';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const HERO_SLIDES = [
  {
    id: 1,
    tag: "Campus Circular Economy",
    title: "Exchange, Rent & Thrift on Campus",
    subtitle: "Save up to 70% on semester textbooks, vintage outerwear, and dorm tech with zero carbon footprint.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80",
    link: "/products?deals=true",
    cta: "Explore Campus Deals"
  },
  {
    id: 2,
    tag: "Semester Rental Program",
    title: "Why Buy When You Can Rent?",
    subtitle: "Rent CLRS algorithms textbooks, graphing calculators, and mini air fryers starting at ₹90/month.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1600&q=80",
    link: "/products?listingType=rent",
    cta: "Browse Semester Rentals"
  },
  {
    id: 3,
    tag: "Sustainable Streetwear",
    title: "Vintage Denim, Hoodies & Upcycled Bags",
    subtitle: "Shop curated pre-loved clothes verified for quality and cleaned for instant college fest wear.",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&q=80",
    link: "/products?category=Fashion",
    cta: "Shop Campus Thrift"
  }
];

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const dealsScrollRef = useRef(null);
  const rentalsScrollRef = useRef(null);

  // Load real backend listings
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchListings()
      .then((data) => {
        if (isMounted) setListings(data);
      })
      .catch((err) => console.error('Failed to load listings:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Slide rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Grouped listings for Amazon 4-grid Quad cards
  const textbooks = listings.filter((p) => p.category === 'Textbooks').slice(0, 4);
  const fashion = listings.filter((p) => p.category === 'Fashion').slice(0, 4);
  const electronics = listings.filter((p) => p.category === 'Electronics').slice(0, 4);
  const dormLiving = listings.filter((p) => p.category === 'Dorm & Living').slice(0, 4);

  const rentalListings = listings.filter((p) => p.isRentable);
  const dealsListings = listings.filter((p) => p.discountPercentage >= 20 || p.price < 1500);

  return (
    <div className="relative pb-10 -mt-4 -mx-2 sm:-mx-4 overflow-hidden select-none">
      
      {/* 1. HERO BANNER CAROUSEL WITH THRIFTSYNC PALETTE & GRADIENT FADE */}
      <div className="relative w-full h-[260px] sm:h-[370px] md:h-[480px] lg:h-[540px] bg-[#122620]">
        
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center brightness-[0.7]"
            />

            {/* Content overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#122620]/95 via-[#122620]/60 to-transparent flex items-center">
              <div className="max-w-[1500px] mx-auto px-6 sm:px-12 w-full text-white">
                <div className="max-w-xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E07A5F] text-white font-black text-[11px] sm:text-xs rounded-full uppercase tracking-wider shadow">
                    <Leaf className="w-3.5 h-3.5" />
                    <span>{slide.tag}</span>
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-[#E6E4DD] line-clamp-2 drop-shadow">
                    {slide.subtitle}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs sm:text-sm rounded-full shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/seller"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D3B32]/90 hover:bg-[#1D3B32] border border-[#2A6F4E] text-white font-bold text-xs sm:text-sm rounded-full shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-[#E07A5F]" />
                      <span>Seller Hub</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Arrow Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-2 sm:left-4 top-1/3 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-2 sm:right-4 top-1/3 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
        </button>

        {/* Bottom Gradient Fade into Alabaster #F6F5F0 */}
        <div 
          className="absolute bottom-0 inset-x-0 h-40 md:h-64 pointer-events-none z-15"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(246, 245, 240, 0.4) 40%, #F6F5F0 100%)'
          }}
        />
      </div>

      {/* 2. OVERLAPPING AMAZON 4-GRID QUAD CARDS */}
      <div className="relative z-20 max-w-[1500px] mx-auto px-3 sm:px-6 -mt-16 sm:-mt-28 md:-mt-44 lg:-mt-64">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Quad 1: Textbooks */}
          <div className="bg-white p-4 rounded-md shadow-md border border-[#E6E4DD] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold text-[#122620] leading-tight">
                  Semester Textbooks & Notes
                </h2>
                <BookOpen className="w-4 h-4 text-[#2A6F4E]" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {textbooks.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block text-left"
                  >
                    <div className="aspect-square bg-[#F9F8F5] rounded overflow-hidden p-2 flex items-center justify-center border border-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] text-[#122620] font-semibold truncate mt-1">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#E07A5F] font-bold">
                      {formatCurrency(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/products?category=Textbooks"
              className="text-xs text-[#2A6F4E] hover:text-[#122620] hover:underline font-bold"
            >
              See all Course Textbooks →
            </Link>
          </div>

          {/* Quad 2: Fashion & Thrift */}
          <div className="bg-white p-4 rounded-md shadow-md border border-[#E6E4DD] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold text-[#122620] leading-tight">
                  Vintage Outerwear & Thrift
                </h2>
                <ShoppingBag className="w-4 h-4 text-[#E07A5F]" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {fashion.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block text-left"
                  >
                    <div className="aspect-square bg-[#F9F8F5] rounded overflow-hidden p-2 flex items-center justify-center border border-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] text-[#122620] font-semibold truncate mt-1">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#2A6F4E] font-bold">
                      {item.condition} • {formatCurrency(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/products?category=Fashion"
              className="text-xs text-[#2A6F4E] hover:text-[#122620] hover:underline font-bold"
            >
              Browse Campus Clothes →
            </Link>
          </div>

          {/* Quad 3: Campus Tech & Calculators */}
          <div className="bg-white p-4 rounded-md shadow-md border border-[#E6E4DD] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold text-[#122620] leading-tight">
                  Electronics & Study Tech
                </h2>
                <Sparkles className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {electronics.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block text-left"
                  >
                    <div className="aspect-square bg-[#F9F8F5] rounded overflow-hidden p-2 flex items-center justify-center border border-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] text-[#122620] font-semibold truncate mt-1">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#E07A5F] font-bold">
                      {formatCurrency(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/products?category=Electronics"
              className="text-xs text-[#2A6F4E] hover:text-[#122620] hover:underline font-bold"
            >
              Explore Study Electronics →
            </Link>
          </div>

          {/* Quad 4: Dorm Appliances */}
          <div className="bg-white p-4 rounded-md shadow-md border border-[#E6E4DD] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold text-[#122620] leading-tight">
                  Dorm Gear & Appliances
                </h2>
                <Repeat className="w-4 h-4 text-[#1D3B32]" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {dormLiving.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block text-left"
                  >
                    <div className="aspect-square bg-[#F9F8F5] rounded overflow-hidden p-2 flex items-center justify-center border border-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] text-[#122620] font-semibold truncate mt-1">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#2A6F4E] font-bold">
                      {item.isRentable ? `Rent ₹${item.rentalRate}/mo` : formatCurrency(item.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/products?category=Dorm%20%26%20Living"
              className="text-xs text-[#2A6F4E] hover:text-[#122620] hover:underline font-bold"
            >
              Shop Dorm Upgrades →
            </Link>
          </div>

        </div>

        {/* 3. VALUE PROPOSITION STRIP */}
        <div className="bg-white rounded-md p-4 border border-[#E6E4DD] mb-6 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="flex items-center gap-3 px-2 pt-2 md:pt-0">
              <Leaf className="w-7 h-7 text-[#2A6F4E] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#122620]">100% Peer Verified</p>
                <p className="text-[11px] text-[#5C635E]">Student verified & inspected condition</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 pt-2 md:pt-0">
              <Repeat className="w-7 h-7 text-[#E07A5F] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#122620]">Semester Rentals</p>
                <p className="text-[11px] text-[#5C635E]">Rent books & gear at 80% discount</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 pt-2 md:pt-0">
              <MapPin className="w-7 h-7 text-[#2A6F4E] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#122620]">Campus Meetup Zones</p>
                <p className="text-[11px] text-[#5C635E]">Safe designated handovers at library & gates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 pt-2 md:pt-0">
              <ShieldCheck className="w-7 h-7 text-[#1D3B32] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#122620]">Cash / UPI on Handover</p>
                <p className="text-[11px] text-[#5C635E]">Inspect before you pay in person</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. TODAY'S CAMPUS DEALS CAROUSEL */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-[#E6E4DD] mb-6 shadow-xs relative">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#122620] flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-[#E07A5F]" />
                <span>Today's Campus Deals</span>
              </h2>
              <span className="text-xs text-[#2A6F4E] hover:underline font-bold ml-2">
                <Link to="/products?deals=true">See all campus deals</Link>
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCarousel(dealsScrollRef, 'left')}
                className="p-1.5 rounded border border-[#E6E4DD] hover:bg-gray-100 text-gray-700 cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel(dealsScrollRef, 'right')}
                className="p-1.5 rounded border border-[#E6E4DD] hover:bg-gray-100 text-gray-700 cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={dealsScrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {dealsListings.map((product) => (
              <div key={product.id} className="w-[220px] sm:w-[245px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* 5. SEMESTER RENTALS CAROUSEL */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-[#E6E4DD] mb-6 shadow-xs relative">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#122620] flex items-center gap-1.5">
                <Repeat className="w-5 h-5 text-[#2A6F4E]" />
                <span>Semester Rentals (Pay by Day or Month)</span>
              </h2>
              <span className="text-xs text-[#2A6F4E] hover:underline font-bold ml-2">
                <Link to="/products?listingType=rent">Explore all rentals</Link>
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCarousel(rentalsScrollRef, 'left')}
                className="p-1.5 rounded border border-[#E6E4DD] hover:bg-gray-100 text-gray-700 cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel(rentalsScrollRef, 'right')}
                className="p-1.5 rounded border border-[#E6E4DD] hover:bg-gray-100 text-gray-700 cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={rentalsScrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {rentalListings.map((product) => (
              <div key={product.id} className="w-[220px] sm:w-[245px] shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* 6. SELLER CTA BANNER */}
        <div className="bg-gradient-to-r from-[#1D3B32] to-[#122620] text-white rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md mb-6">
          <div className="space-y-1.5 max-w-xl text-center sm:text-left">
            <span className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
              Earn Money While Clearing Out Your Dorm
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">
              Have textbooks or clothes you don't use anymore?
            </h3>
            <p className="text-xs text-[#E6E4DD] leading-relaxed">
              List them on ThriftSync in under 60 seconds. Sell outright or rent to peers for passive income during exam season.
            </p>
          </div>
          <Link
            to="/seller"
            className="px-6 py-3 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs sm:text-sm rounded-full shadow-md whitespace-nowrap transition-transform hover:scale-105"
          >
            Go to Seller Hub
          </Link>
        </div>

      </div>

    </div>
  );
}
