import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Repeat, 
  Sparkles, 
  Leaf, 
  Search, 
  BookOpen, 
  Shirt, 
  Laptop, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Info, 
  LogOut, 
  UserCheck, 
  RotateCcw, 
  X, 
  ArrowUpDown,
  Settings
} from 'lucide-react';

// Authentication
import { useAuth } from '../features/authentication/authContext.jsx';
import { AuthModal } from '../features/authentication/AuthModal.jsx';

// Listings & Marketplace Features
import { CreateListingModal } from '../features/listings/CreateListingModal.jsx';
import { ListingDetailModal } from '../features/listings/ListingDetailModal.jsx';
import { fetchListings } from '../features/listings/listingService.js';

// Circular Swaps Features
import { ProposeSwapModal } from '../features/swaps/ProposeSwapModal.jsx';
import { MySwapsModal } from '../features/swaps/MySwapsModal.jsx';

// Rentals & Lifecycle Features
import { RentItemModal } from '../features/rentals/RentItemModal.jsx';
import { MyRentalsModal } from '../features/rentals/MyRentalsModal.jsx';

// Orders & Campus Purchases
import { PurchaseModal } from '../features/orders/PurchaseModal.jsx';
import { MyOrdersModal } from '../features/orders/MyOrdersModal.jsx';

// Verified Reviews & Trust
import { LeaveReviewModal } from '../features/reviews/LeaveReviewModal.jsx';

// Notifications & Campus Safety
import { NotificationBell } from '../features/notifications/NotificationBell.jsx';
import { CampusSafetyModal } from '../features/safety/CampusSafetyModal.jsx';

// Campus Administration & Moderation
import { AdminDashboardModal } from '../features/administration/AdminDashboardModal.jsx';
import { ReportItemModal } from '../features/administration/ReportItemModal.jsx';
import { AccountSettingsModal } from '../features/users/AccountSettingsModal.jsx';

// Lazy-loaded standalone workspaces and legal pages
const AdminWorkspace = React.lazy(() =>
  import('../features/administration/AdminWorkspace.jsx').then((m) => ({ default: m.AdminWorkspace }))
);
const TermsPage = React.lazy(() =>
  import('../pages/TermsPage.jsx').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = React.lazy(() =>
  import('../pages/PrivacyPage.jsx').then((m) => ({ default: m.PrivacyPage }))
);

// Money Path MVP, Cart, Checkout, Policies & Indian Currency
import { formatINR } from '../utils/currency.js';
import { LoginPage } from '../features/authentication/LoginPage.jsx';
import { CartDrawer } from '../features/cart/CartDrawer.jsx';
import { CheckoutModal } from '../features/checkout/CheckoutModal.jsx';
import {
  fetchCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
} from '../features/cart/cartService.js';

// Vengeance UI Components
import { AnimatedRays } from '@/components/ui/animated-rays';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { AnimatedNumber } from '@/components/ui/animated-number';

// Navigation & Marketplace Components
import { HeaderNavbar } from '../components/navigation/HeaderNavbar.jsx';
import { ProductCard } from '../components/marketplace/ProductCard.jsx';
import { HeroAnimated } from '@/components/ui/hero-animated';

// Skiper UI Components
import { 
  Link001, 
  Link002, 
  Link003, 
  Link004, 
  Link005 
} from '@/components/ui/skiper-ui/skiper40';
import { ThemeToggleButton2 } from '@/components/ui/skiper-ui/skiper4';

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const [activeHash, setActiveHash] = useState(() => window.location.hash || '#marketplace');
  const [activeTab, setActiveTab] = useState('all');
  const [metricCount] = useState(2480);

  // Campus Safety Modal state
  const [isCampusSafetyOpen, setIsCampusSafetyOpen] = useState(false);

  // Authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalMessage, setAuthModalMessage] = useState('');

  // Listings state
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState(null);
  const [liveListings, setLiveListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Swaps state
  const [isProposeSwapOpen, setIsProposeSwapOpen] = useState(false);
  const [targetSwapListing, setTargetSwapListing] = useState(null);
  const [isMySwapsOpen, setIsMySwapsOpen] = useState(false);

  // Rentals state
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [targetRentListing, setTargetRentListing] = useState(null);
  const [isMyRentalsOpen, setIsMyRentalsOpen] = useState(false);

  // Orders state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [targetPurchaseListing, setTargetPurchaseListing] = useState(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  // Reviews state
  const [isLeaveReviewOpen, setIsLeaveReviewOpen] = useState(false);
  const [reviewTargetData, setReviewTargetData] = useState(null);

  // Campus Administration & Moderation state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTargetListing, setReportingTargetListing] = useState(null);

  // Shopping Bag & Money Path Checkout state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cartData, setCartData] = useState({
    items: [],
    totals: { subtotalPaise: 0, shippingPaise: 4900, totalPaise: 4900, isFreeShipping: false },
  });

  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash || '#marketplace';
      setActiveHash(h);
      if (h === '#settings') {
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    fetchCart()
      .then((res) => {
        if (res) setCartData(res);
      })
      .catch(() => {});
  }, [user]);

  const handleAddToCart = async (listingId, quantity = 1) => {
    try {
      const updated = await addItemToCart(listingId, quantity);
      setCartData(updated);
      setIsCartOpen(true);
    } catch (err) {
      alert(err.message || 'Could not add item to bag.');
    }
  };

  const handleUpdateCartQuantity = async (listingId, quantity) => {
    try {
      const updated = await updateCartItemQuantity(listingId, quantity);
      setCartData(updated);
    } catch (err) {}
  };

  const handleRemoveCartItem = async (listingId) => {
    try {
      const updated = await removeItemFromCart(listingId);
      setCartData(updated);
    } catch (err) {}
  };

  // Search & Filtering state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [totalFound, setTotalFound] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasActiveFilters =
    activeTab !== 'all' ||
    selectedCondition !== 'all' ||
    selectedSort !== 'newest' ||
    maxPriceFilter !== '' ||
    debouncedSearch.trim() !== '';

  const handleResetFilters = () => {
    setActiveTab('all');
    setSelectedCondition('all');
    setSelectedSort('newest');
    setMaxPriceFilter('');
    setSearchQuery('');
    setDebouncedSearch('');
  };

  useEffect(() => {
    let isMounted = true;
    const loadListings = async () => {
      setIsLoadingListings(true);
      try {
        const params = {};
        if (activeTab === 'books') params.category = 'Textbooks';
        else if (activeTab === 'fashion') params.category = 'Fashion';
        else if (activeTab === 'electronics') params.category = 'Electronics';
        else if (activeTab === 'dorm') params.category = 'Dorm & Living';
        else if (activeTab === 'swaps') params.listingType = 'swap';
        else if (activeTab === 'rentals') params.listingType = 'rent';

        if (selectedCondition && selectedCondition !== 'all') {
          params.condition = selectedCondition;
        }

        if (selectedSort && selectedSort !== 'newest') {
          params.sort = selectedSort;
        }

        if (maxPriceFilter && !isNaN(Number(maxPriceFilter)) && Number(maxPriceFilter) > 0) {
          params.maxPrice = Number(maxPriceFilter);
        }

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        const res = await fetchListings(params);
        if (isMounted) {
          setLiveListings(res.listings || []);
          setTotalFound(res.total !== undefined ? res.total : (res.listings ? res.listings.length : 0));
        }
      } catch (err) {
        // Fallback gracefully without breaking UI
        if (isMounted) {
          setLiveListings([]);
          setTotalFound(0);
        }
      } finally {
        if (isMounted) {
          setIsLoadingListings(false);
        }
      }
    };

    loadListings();
    return () => {
      isMounted = false;
    };
  }, [activeTab, debouncedSearch, selectedCondition, selectedSort, maxPriceFilter]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash || '#marketplace');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openAuthWithIntent = (mode, message) => {
    setAuthModalMode(mode);
    setAuthModalMessage(message);
    setIsAuthModalOpen(true);
  };

  const handlePostListingClick = () => {
    if (isAuthenticated) {
      setIsCreateListingOpen(true);
    } else {
      openAuthWithIntent('register', 'Please register or sign in with your campus account to post a listing.');
    }
  };

  const handleProposeSwapClick = () => {
    if (isAuthenticated) {
      setIsMySwapsOpen(true);
    } else {
      openAuthWithIntent('login', 'Please sign in to propose and manage swap exchanges with fellow students.');
    }
  };

  const handleInitiateSwapForListing = (listing) => {
    if (isAuthenticated) {
      setTargetSwapListing(listing);
      setIsProposeSwapOpen(true);
    } else {
      openAuthWithIntent('login', 'Please sign in to propose a swap exchange for this item.');
    }
  };

  const handleInitiateRentForListing = (listing) => {
    if (isAuthenticated) {
      setTargetRentListing(listing);
      setIsRentModalOpen(true);
    } else {
      openAuthWithIntent('login', 'Please sign in to request a rental for this campus item.');
    }
  };

  const handleInitiatePurchaseForListing = (listing) => {
    if (isAuthenticated) {
      if (listing._id) {
        handleAddToCart(listing._id, 1);
      } else {
        setTargetPurchaseListing(listing);
        setIsPurchaseModalOpen(true);
      }
    } else {
      openAuthWithIntent('login', 'Please sign in to purchase items from campus peers.');
    }
  };

  const handleOpenLeaveReview = (reviewData) => {
    setReviewTargetData(reviewData);
    setIsLeaveReviewOpen(true);
  };

  const handleListingCreated = (newListing) => {
    setLiveListings((prev) => [newListing, ...prev]);
    const el = document.getElementById('marketplace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = [
    { id: 'all', name: 'All Listings', icon: ShoppingBag },
    { id: 'books', name: 'Textbooks', icon: BookOpen },
    { id: 'fashion', name: 'Pre-Owned Fashion', icon: Shirt },
    { id: 'electronics', name: 'Tech & Gadgets', icon: Laptop },
    { id: 'dorm', name: 'Dorm & Living', icon: ShieldCheck },
    { id: 'swaps', name: 'Circular Swaps', icon: Repeat },
    { id: 'rentals', name: 'Rentals & Gear', icon: Clock },
  ];

  const featuredItems = [
    {
      id: 1,
      title: 'Principles of Economics (10th Ed)',
      type: 'Buy / Rent',
      price: '$28.00',
      rentalRate: '$8 / semester',
      campus: 'North Quad',
      category: 'Textbooks',
      condition: 'Like New',
      accent: 'border-sustainability text-sustainability dark:border-green-400 dark:text-green-400',
    },
    {
      id: 2,
      title: 'Vintage Corduroy Campus Jacket',
      type: 'Swap Available',
      price: '$35.00',
      rentalRate: 'Eligible for swap',
      campus: 'East Campus Dorms',
      category: 'Fashion',
      condition: 'Excellent',
      accent: 'border-rental text-rental dark:border-orange-400 dark:text-orange-400',
    },
    {
      id: 3,
      title: 'Graphing Calculator TI-84 Plus',
      type: 'Rental Special',
      price: '$55.00',
      rentalRate: '$12 / month',
      campus: 'Science Commons',
      category: 'Electronics',
      condition: 'Tested & Working',
      accent: 'border-sustainability text-sustainability dark:border-green-400 dark:text-green-400',
    },
  ];

  const swapRequests = [
    {
      id: 101,
      offering: 'Calculus Early Transcendentals (8th Ed)',
      seeking: 'Organic Chemistry Model Kit',
      dorm: 'South Tower Dorms',
      posted: '2 hours ago',
    },
    {
      id: 102,
      offering: 'Dorm Desk Lamp + Extension Strip',
      seeking: 'Mini Fridge Organizers / Bins',
      dorm: 'West Village Quad',
      posted: 'Yesterday',
    },
  ];

  // Routing Rule 0: Admin Workspace (strictly isolated)
  if (activeHash === '#admin') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-stone-600 font-medium">Loading ThriftSync Admin...</div>}>
        <AdminWorkspace
          onExit={() => {
            window.location.hash = '#marketplace';
            setActiveHash('#marketplace');
          }}
        />
      </React.Suspense>
    );
  }

  // Routing Rule 1: Direct link to Terms and Conditions
  if (activeHash === '#terms') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-stone-600 font-medium">Loading Terms & Conditions...</div>}>
        <TermsPage
          onBack={() => {
            window.location.hash = '#marketplace';
            setActiveHash('#marketplace');
          }}
        />
      </React.Suspense>
    );
  }

  // Routing Rule 2: Direct link to Privacy Policy
  if (activeHash === '#privacy') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-stone-600 font-medium">Loading Privacy Policy...</div>}>
        <PrivacyPage
          onBack={() => {
            window.location.hash = '#marketplace';
            setActiveHash('#marketplace');
          }}
        />
      </React.Suspense>
    );
  }

  // Routing Rule 3: Login-First for signed-out visitors
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          window.location.hash = '#marketplace';
          setActiveHash('#marketplace');
          fetchCart()
            .then((res) => {
              if (res) setCartData(res);
            })
            .catch(() => {});
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans antialiased selection:bg-sustainability selection:text-white transition-colors duration-300">
      {/* Editorial Header & Responsive Navigation */}
      <HeaderNavbar
        activeHash={activeHash}
        setActiveHash={setActiveHash}
        user={user}
        isAuthenticated={isAuthenticated}
        logout={logout}
        cartCount={cartData?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCampusSafety={() => setIsCampusSafetyOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenMySwaps={() => setIsMySwapsOpen(true)}
        onOpenMyRentals={() => setIsMyRentalsOpen(true)}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => {
          window.location.hash = '#admin';
          setActiveHash('#admin');
        }}
        onOpenAuth={(mode, msg) => openAuthWithIntent(mode, msg)}
        onPostListing={handlePostListingClick}
      />

      {/* Animated Hero Section (21st.dev ohmfordev/hero) */}
      <HeroAnimated
        badgeText="Sustainable Campus Commerce"
        title="Buy, rent, and swap pre-owned gear with trusted peers."
        subtitle="ThriftSync connects verified students across residence halls to trade textbooks, dorm goods, clothing, and calculators. Zero waste. Zero inflated retail prices."
        primaryAction={{
          label: 'Explore Campus Finds',
          href: '#marketplace',
          onClick: (e) => {
            e.preventDefault();
            const el = document.getElementById('marketplace');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          },
        }}
        secondaryAction={{
          label: 'Browse Categories',
          href: '#categories',
          onClick: (e) => {
            e.preventDefault();
            const el = document.getElementById('categories');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          },
        }}
        metrics={[
          { label: 'Campus Verification', value: '100% Peer Verified' },
          { label: 'Flexible Rentals', value: 'Up to 70% Savings' },
          { label: 'Circular Swaps', value: 'Zero Campus Waste' },
        ]}
      />

      {/* Sustainability Metrics Section with Vengeance UI AnimatedNumber */}
      <section id="impact" className="py-12 bg-background border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium tracking-wide">
              <Info className="size-3.5 text-stone-500" />
              <span>Illustrative Campus Simulation (Live telemetry connects upon campus rollout)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center">
              <div className="flex items-center text-4xl font-extrabold text-sustainability dark:text-green-400">
                <AnimatedNumber value={metricCount} className="text-4xl font-black" />
                <span className="ml-1 text-2xl font-bold">+</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-text">Estimated Items Rehomed</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Illustrative projection based on dorm move-out averages</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center">
              <div className="flex items-center text-4xl font-extrabold text-rental dark:text-orange-400">
                <AnimatedNumber value={840} className="text-4xl font-black" />
                <span className="ml-1 text-2xl font-bold">kg</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-text">Estimated CO₂ Offset</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Illustrative metric for student book and garment re-use</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface dark:bg-[#1E1D1B] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center">
              <div className="flex items-center text-4xl font-extrabold text-sustainability dark:text-green-400">
                <span className="text-2xl font-bold mr-1">$</span>
                <AnimatedNumber value={32} className="text-4xl font-black" />
                <span className="text-2xl font-bold">,</span>
                <AnimatedNumber value={500} className="text-4xl font-black" />
              </div>
              <p className="mt-2 text-sm font-semibold text-text">Projected Peer Savings</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Estimated circulating savings within student community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Categories via Skiper UI Animated Links */}
      <section id="categories" className="py-14 bg-surface dark:bg-[#1E1D1B] border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-sustainability dark:text-green-400">Browse Collections</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text mt-1">Explore by Department & Need</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      isActive 
                        ? 'bg-sustainability text-white shadow-sm' 
                        : 'bg-background text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skiper UI Link Grid Showcase */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 py-4 px-6 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-center">
            <div className="p-3 flex flex-col items-center justify-center">
              <BookOpen className="size-5 text-sustainability dark:text-green-400 mb-2" />
              <Link001 href="#marketplace" className="text-sm font-bold text-text">Organic Chemistry</Link001>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">24 copies available</span>
            </div>
            <div className="p-3 flex flex-col items-center justify-center">
              <Shirt className="size-5 text-rental dark:text-orange-400 mb-2" />
              <Link002 href="#marketplace" className="text-sm font-bold text-text">Vintage Hoodies</Link002>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">18 sizes listed</span>
            </div>
            <div className="p-3 flex flex-col items-center justify-center">
              <Laptop className="size-5 text-sustainability dark:text-green-400 mb-2" />
              <Link003 href="#marketplace" className="text-sm font-bold text-text">Monitors & Cables</Link003>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">12 dorm items</span>
            </div>
            <div className="p-3 flex flex-col items-center justify-center">
              <Repeat className="size-5 text-rental dark:text-orange-400 mb-2" />
              <Link004 href="#swaps" className="text-sm font-bold text-text">Direct Book Swaps</Link004>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Free peer exchanges</span>
            </div>
            <div className="p-3 flex flex-col items-center justify-center">
              <Sparkles className="size-5 text-sustainability dark:text-green-400 mb-2" />
              <Link005 href="#marketplace" className="text-sm font-bold text-text">Upcycled Bags</Link005>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Local handmade</span>
            </div>
          </div>
        </div>
      </section>

      {/* Student Swaps Section */}
      <section id="swaps" className="py-14 bg-background border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-rental dark:text-orange-400">Direct Exchanges</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-text mt-1">Student Circular Swaps</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Trade pre-owned gear directly without cash transactions (Illustrative Prototype Previews).</p>
            </div>
            <InteractiveHoverButton
              className="bg-rental text-white border-rental hover:border-rental text-xs font-semibold py-2 px-5"
              onClick={handleProposeSwapClick}
            >
              Propose a Swap
            </InteractiveHoverButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {swapRequests.map((swap) => (
              <div 
                key={swap.id}
                className="bg-surface dark:bg-[#1E1D1B] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-3">
                    <span className="font-semibold text-rental dark:text-orange-400">Swap Offer</span>
                    <span>{swap.posted} • {swap.dorm}</span>
                  </div>
                  <h4 className="text-base font-bold text-text">{swap.offering}</h4>
                  <div className="mt-4 p-3 rounded-xl bg-background border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Seeking in exchange:</span>
                    <p className="font-bold text-sustainability dark:text-green-400 mt-0.5">{swap.seeking}</p>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthenticated) {
                        setIsMySwapsOpen(true);
                      } else {
                        openAuthWithIntent('login', 'Please sign in to accept or propose a swap exchange.');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-sustainability hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Accept or Counter Swap</span>
                    <Repeat className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campus Listings */}
      <section id="marketplace" className="py-16 bg-surface dark:bg-[#1E1D1B] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-sustainability dark:text-green-400">Live Inventory</span>
              <h3 className="text-2xl font-bold text-text">
                {liveListings.length > 0 ? 'Active Student Listings' : 'Recently Listed on Campus'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {liveListings.length > 0
                  ? `Showing ${liveListings.length} verified campus listings`
                  : 'Illustrative preview items for interface evaluation'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {liveListings.length > 0 ? 'Verified database items' : 'Illustrative preview catalog'}
              </span>
              <button
                type="button"
                onClick={handlePostListingClick}
                className="px-3.5 py-1.5 rounded-xl bg-sustainability text-white hover:bg-emerald-800 text-xs font-bold shadow-sm transition"
              >
                + Post New Item
              </button>
            </div>
          </div>

          {/* Marketplace Search & Discovery Controls Bar */}
          <div className="mb-6 p-4 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Keyword Search Input */}
              <div className="relative flex-1">
                <Search className="size-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search campus items by title, author or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearch('');
                    }}
                    className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    aria-label="Clear search text"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Filter Selectors: Condition, Sort, Max Price */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Condition Selector */}
                <div className="flex items-center gap-1">
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-surface dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability"
                    aria-label="Filter by item condition"
                  >
                    <option value="all">All Conditions</option>
                    <option value="Like New">Like New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1">
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-surface dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability"
                    aria-label="Sort listings"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Sort: Price Low → High</option>
                    <option value="price_desc">Sort: Price High → Low</option>
                    <option value="rental_asc">Sort: Rental Rate Low → High</option>
                    <option value="oldest">Sort: Oldest First</option>
                  </select>
                </div>

                {/* Max Price Filter */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Max $..."
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                    className="w-20 px-2.5 py-2 rounded-xl bg-surface dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-xs text-text focus:outline-none focus:ring-2 focus:ring-sustainability"
                    aria-label="Filter by maximum price"
                  />
                </div>

                {/* Reset Filters CTA */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-red-400 bg-surface dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 hover:text-red-600 transition"
                    title="Reset all search filters"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Chips / Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px]">
                <span className="text-stone-500 dark:text-stone-400 font-semibold">Active filters:</span>
                {activeTab !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sustainability/10 text-sustainability dark:text-green-400 border border-sustainability/20 font-medium">
                    Department: {categories.find((c) => c.id === activeTab)?.name || activeTab}
                    <button type="button" onClick={() => setActiveTab('all')} aria-label="Clear category filter">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {selectedCondition !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-medium">
                    Condition: {selectedCondition}
                    <button type="button" onClick={() => setSelectedCondition('all')} aria-label="Clear condition filter">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {maxPriceFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sustainability/10 text-sustainability dark:text-green-400 border border-sustainability/20 font-medium">
                    Price: &le; ${maxPriceFilter}
                    <button type="button" onClick={() => setMaxPriceFilter('')} aria-label="Clear price filter">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {selectedSort !== 'newest' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 font-medium">
                    Sorted: {selectedSort}
                    <button type="button" onClick={() => setSelectedSort('newest')} aria-label="Clear sort filter">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rental/10 text-rental dark:text-orange-400 border border-rental/20 font-medium">
                    Search: &ldquo;{debouncedSearch}&rdquo;
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedSearch('');
                      }}
                      aria-label="Clear search keyword"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {isLoadingListings ? (
            <div className="py-16 text-center text-stone-500 dark:text-stone-400 text-xs">
              <div className="inline-block animate-spin size-6 border-2 border-sustainability border-t-transparent rounded-full mb-3"></div>
              <p>Loading campus marketplace inventory...</p>
            </div>
          ) : liveListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveListings.map((item) => (
                <ProductCard
                  key={item._id}
                  item={item}
                  onViewDetails={setSelectedListingForDetail}
                  onAddToCart={(id, qty) => handleAddToCart(id, qty)}
                  onInitiateSwap={handleInitiateSwapForListing}
                  onInitiateRent={handleInitiateRentForListing}
                  onInitiatePurchase={handleInitiatePurchaseForListing}
                />
              ))}
            </div>
          ) : hasActiveFilters ? (
            <div className="py-14 px-6 rounded-2xl bg-background border border-stone-200 dark:border-stone-800 text-center max-w-lg mx-auto shadow-sm">
              <Search className="size-8 mx-auto text-stone-400 mb-3" />
              <h4 className="text-base font-bold text-text">No Matching Campus Listings</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4 leading-relaxed">
                We couldn&apos;t find any active student items matching your current filters. Try adjusting your search term, department, condition, or maximum price.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sustainability text-white text-xs font-bold hover:bg-emerald-800 transition shadow-sm"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={{
                      ...item,
                      _id: 'sample-' + item.id,
                      isIllustrative: true,
                    }}
                    onViewDetails={() =>
                      setSelectedListingForDetail({
                        ...item,
                        isIllustrative: true,
                        description: 'Illustrative preview item created for platform evaluation and campus testing.',
                      })
                    }
                    onAddToCart={() => handleAddToCart('sample-buy-' + item.id, 1)}
                    onInitiateSwap={() =>
                      handleInitiateSwapForListing({
                        _id: 'sample-swap-' + item.id,
                        title: item.title,
                        category: item.category,
                        condition: item.condition,
                        campus: item.campus,
                        swapFor: 'Relevant peer trade',
                        isIllustrative: true,
                      })
                    }
                    onInitiateRent={() =>
                      handleInitiateRentForListing({
                        _id: 'sample-rent-' + item.id,
                        title: item.title,
                        category: item.category,
                        condition: item.condition,
                        campus: item.campus,
                        rentalRate: 12,
                        rentalPeriod: 'per month',
                        deposit: 20,
                        isIllustrative: true,
                      })
                    }
                    onInitiatePurchase={() =>
                      handleInitiatePurchaseForListing({
                        _id: 'sample-buy-' + item.id,
                        title: item.title,
                        category: item.category,
                        condition: item.condition,
                        campus: item.campus,
                        price: parseFloat(item.price.replace('$', '')) || 28,
                        isIllustrative: true,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141413] text-[#EFECE6] border-t border-stone-800 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-sustainability text-white flex items-center justify-center font-bold text-sm">
              TS
            </span>
            <span className="font-bold text-lg text-white">ThriftSync</span>
            <span className="text-xs text-stone-400">© 2026 Sustainable Campus Network</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-400">
            <a href="#marketplace" className="hover:text-white transition">Campus Catalog</a>
            <a href="#swaps" className="hover:text-white transition">Swap Policies</a>
            <a href="#impact" className="hover:text-white transition">Environmental Metrics</a>
            <a href="#settings" onClick={(e) => { e.preventDefault(); setIsSettingsOpen(true); }} className="hover:text-white transition">Account Settings</a>
            <a href="#terms" className="hover:text-white transition">Terms of Service</a>
            <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateListingOpen}
        onClose={() => setIsCreateListingOpen(false)}
        onListingCreated={handleListingCreated}
      />

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListingForDetail}
        isOpen={Boolean(selectedListingForDetail)}
        onClose={() => setSelectedListingForDetail(null)}
        onProposeSwap={handleInitiateSwapForListing}
        onRentItem={handleInitiateRentForListing}
        onBuyItem={handleInitiatePurchaseForListing}
        onReportListing={(listing) => {
          if (!isAuthenticated) {
            openAuthWithIntent('login', 'Please sign in to report a listing or safety concern.');
            return;
          }
          setReportingTargetListing(listing);
          setIsReportModalOpen(true);
        }}
      />

      {/* Propose Swap Modal */}
      <ProposeSwapModal
        isOpen={isProposeSwapOpen}
        targetListing={targetSwapListing}
        onClose={() => {
          setIsProposeSwapOpen(false);
          setTargetSwapListing(null);
        }}
        onProposalSubmitted={() => {
          setIsMySwapsOpen(true);
        }}
        onOpenCreateListing={() => {
          setIsCreateListingOpen(true);
        }}
      />

      {/* My Swaps Modal */}
      <MySwapsModal
        isOpen={isMySwapsOpen}
        onClose={() => setIsMySwapsOpen(false)}
        onLeaveReview={handleOpenLeaveReview}
      />

      {/* Rent Item Modal */}
      <RentItemModal
        isOpen={isRentModalOpen}
        listing={targetRentListing}
        onClose={() => {
          setIsRentModalOpen(false);
          setTargetRentListing(null);
        }}
        onRentalRequested={() => {
          setIsMyRentalsOpen(true);
        }}
      />

      {/* My Rentals Dashboard Modal */}
      <MyRentalsModal
        isOpen={isMyRentalsOpen}
        onClose={() => setIsMyRentalsOpen(false)}
        onLeaveReview={handleOpenLeaveReview}
        onRentalUpdated={() => {
          // Re-fetch listings to update 'rented' or 'active' statuses
          fetchListings().then((res) => {
            if (res?.listings) setLiveListings(res.listings);
          }).catch(() => {});
        }}
      />

      {/* Outright Purchase Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        listing={targetPurchaseListing}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setTargetPurchaseListing(null);
        }}
        onOrderPlaced={() => {
          setIsMyOrdersOpen(true);
          fetchListings().then((res) => {
            if (res?.listings) setLiveListings(res.listings);
          }).catch(() => {});
        }}
      />

      {/* My Orders Dashboard Modal */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        onLeaveReview={handleOpenLeaveReview}
        onOrderUpdated={() => {
          fetchListings().then((res) => {
            if (res?.listings) setLiveListings(res.listings);
          }).catch(() => {});
        }}
      />

      {/* Leave Verified Peer Review Modal */}
      {reviewTargetData && (
        <LeaveReviewModal
          isOpen={isLeaveReviewOpen}
          onClose={() => {
            setIsLeaveReviewOpen(false);
            setReviewTargetData(null);
          }}
          targetUser={reviewTargetData.targetUser}
          listing={reviewTargetData.listing}
          transactionType={reviewTargetData.transactionType}
          transactionId={reviewTargetData.transactionId}
          onReviewSubmitted={() => {
            setIsLeaveReviewOpen(false);
            setReviewTargetData(null);
          }}
        />
      )}

      {/* Campus Handover Safety Guidelines Modal */}
      <CampusSafetyModal
        isOpen={isCampusSafetyOpen}
        onClose={() => setIsCampusSafetyOpen(false)}
      />

      {/* Campus Administration & Moderation Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Report Listing Modal */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        targetListing={reportingTargetListing}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportingTargetListing(null);
        }}
        onReportSubmitted={() => {
          fetchListings().then((res) => {
            if (res?.listings) setLiveListings(res.listings);
          }).catch(() => {});
        }}
      />

      {/* Shopping Bag Drawer (Money Path MVP) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartData={cartData}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Money Path Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartData={cartData}
        onOrderCompleted={(order) => {
          setIsCheckoutOpen(false);
          setIsMyOrdersOpen(true);
          fetchCart().then((res) => {
            if (res) setCartData(res);
          }).catch(() => {});
          fetchListings().then((res) => {
            if (res?.listings) setLiveListings(res.listings);
          }).catch(() => {});
        }}
      />

      {/* Account & Profile Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          if (window.location.hash === '#settings') {
            window.location.hash = '#marketplace';
            setActiveHash('#marketplace');
          }
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        initialMessage={authModalMessage}
      />
    </div>
  );
}
