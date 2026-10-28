import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  MapPin, 
  ChevronDown, 
  User, 
  Leaf, 
  LogOut,
  Package,
  PlusCircle,
  ShieldCheck,
  Heart,
  Store,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { LocationModal } from './LocationModal';

const CATEGORIES = [
  'All Departments',
  'Textbooks',
  'Fashion',
  'Electronics',
  'Dorm & Living',
  'Other',
];

export function Header({ onOpenDrawer }) {
  const { user, isAuthenticated, isAdmin, logout, deliveryLocation } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isSellerStudio = location.pathname.startsWith('/seller') || location.pathname.startsWith('/sell');

  const [selectedCategory, setSelectedCategory] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }
    if (selectedCategory && selectedCategory !== 'All Departments') {
      params.append('category', selectedCategory);
    }
    navigate(`/products?${params.toString()}`);
  };

  return (
    <>
      <header className="bg-[#122620] text-white sticky top-0 z-40 select-none shadow-md">
        
        {/* ROW 1: DESKTOP & MOBILE TOP BAR */}
        <div className="max-w-[1500px] mx-auto px-2 lg:px-4 py-1.5 flex items-center justify-between gap-2 lg:gap-4 h-[62px]">
          
          {/* Mobile Hamburger & Brand */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenDrawer}
              className="lg:hidden p-1.5 rounded hover:ring-1 hover:ring-white/40 text-white focus:outline-none cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* ThriftSync Brand Logo */}
            <Link 
              to="/" 
              className="flex items-center px-2 py-1 rounded hover:outline-1 hover:outline-white/30 transition-all group"
            >
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <Leaf className="w-5 h-5 text-[#E07A5F] group-hover:rotate-12 transition-transform" />
                  <span className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center">
                    Thrift<span className="text-[#E07A5F]">Sync</span>
                  </span>
                  <span className="text-[10px] text-[#A3B899] font-bold">.campus</span>
                </div>
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#E07A5F] to-transparent rounded-full opacity-80" />
              </div>
            </Link>
          </div>

          {/* Desktop Campus Location Selector */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded hover:outline-1 hover:outline-white/30 text-left transition-all shrink-0 cursor-pointer"
            title="Choose delivery address & campus pickup spot"
          >
            <MapPin className="w-4 h-4 text-[#E07A5F] mt-1 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-[#A3B899] font-medium">
                Deliver to {isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Campus'}
              </span>
              <span className="text-[13px] font-bold text-white flex items-center gap-0.5 truncate max-w-[170px]">
                {deliveryLocation.campus || deliveryLocation.city || 'North Campus'}
              </span>
            </div>
          </button>

          {/* DESKTOP SEARCH BAR */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex flex-1 items-stretch max-w-3xl h-10 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#D97706] shadow-xs"
          >
            {/* Category Dropdown */}
            <div className="relative bg-[#E6E4DD] hover:bg-[#DDD9CE] border-r border-[#C4C0B5] flex items-center shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-[#122620] font-semibold pl-3 pr-6 py-2 appearance-none cursor-pointer outline-none max-w-[140px] truncate"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-700 absolute right-2 pointer-events-none" />
            </div>

            {/* Keyword Input */}
            <input
              type="text"
              placeholder="Search campus clothes, algorithms books, calculators, dorm lights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3.5 text-xs sm:text-sm text-[#122620] placeholder:text-gray-500 outline-none"
            />

            {/* Submit Button (Warm Terracotta) */}
            <button
              type="submit"
              className="bg-[#E07A5F] hover:bg-[#C86449] text-white px-5 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5 font-bold" />
            </button>
          </form>

          {/* RIGHT SIDE UTILITIES */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Prominent Admin Dashboard Button if role === 'admin' */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white rounded-md text-xs font-bold transition-all shadow-xs animate-in fade-in"
                title="Campus Administrator Moderation Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* In-App Workspace Mode Switcher (Storefront Buying ⇄ Seller Studio) */}
            {isAuthenticated && (
              isSellerStudio ? (
                <Link
                  to="/"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white rounded-md text-xs font-bold transition-all shadow-xs"
                  title="Switch to Student Storefront (Buying)"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>🛍️ Storefront (Buying)</span>
                </Link>
              ) : (
                <Link
                  to="/seller"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1D3B32] hover:bg-[#24493e] text-[#E07A5F] hover:text-white border border-[#2A6F4E] rounded-md text-xs font-bold transition-all shadow-xs"
                  title="Switch to Campus Seller Studio"
                >
                  <Store className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>🏷️ Seller Studio</span>
                </Link>
              )
            )}

            {/* Account & Lists Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsAccountMenuOpen(true)}
              onMouseLeave={() => setIsAccountMenuOpen(false)}
            >
              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="flex flex-col px-2 py-1.5 rounded hover:outline-1 hover:outline-white/30 text-left transition-all"
              >
                <span className="text-[11px] text-[#A3B899] font-medium leading-tight">
                  Hello, {isAuthenticated && user?.name ? user.name.split(' ')[0] : 'Sign In'}
                </span>
                <span className="text-[13px] font-bold text-white flex items-center gap-0.5 leading-tight">
                  Account & Campus <ChevronDown className="w-3 h-3 text-gray-400 hidden lg:inline" />
                </span>
              </Link>

              {/* Flyout popup */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full pt-1 z-50 w-64 shadow-xl">
                  <div className="bg-white rounded-md border border-[#E6E4DD] text-[#122620] p-4 text-xs space-y-3">
                    {!isAuthenticated ? (
                      <div className="text-center pb-3 border-b border-gray-200">
                        <Link
                          to="/login"
                          className="w-full inline-block bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold py-1.5 px-4 rounded shadow-2xs text-xs mb-1.5"
                          onClick={() => setIsAccountMenuOpen(false)}
                        >
                          Sign in
                        </Link>
                        <p className="text-[11px] text-gray-500">
                          New student?{' '}
                          <Link to="/register" className="text-[#2A6F4E] font-semibold hover:underline">
                            Start here.
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <div className="pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-[#122620]">{user.name}</p>
                          {isAdmin && (
                            <span className="bg-[#1D3B32] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-[11px] truncate">{user.email}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-2">
                        Your ThriftSync
                      </p>
                      <ul className="space-y-2 text-[#122620]">
                        <li>
                          <Link 
                            to="/orders" 
                            className="hover:text-[#2A6F4E] flex items-center gap-1.5 font-medium"
                            onClick={() => setIsAccountMenuOpen(false)}
                          >
                            <Package className="w-3.5 h-3.5 text-[#2A6F4E]" />
                            Your Orders & Handover Status
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/seller" 
                            className="hover:text-[#2A6F4E] flex items-center gap-1.5 font-medium"
                            onClick={() => setIsAccountMenuOpen(false)}
                          >
                            <Store className="w-3.5 h-3.5 text-[#E07A5F]" />
                            Campus Seller Studio
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/profile" 
                            className="hover:text-[#2A6F4E] flex items-center gap-1.5 font-medium"
                            onClick={() => setIsAccountMenuOpen(false)}
                          >
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            Profile, Addresses & Wishlist
                          </Link>
                        </li>
                        {isAdmin && (
                          <li className="pt-1.5 border-t border-gray-100">
                            <Link 
                              to="/admin" 
                              className="text-[#1D3B32] hover:text-[#122620] font-black flex items-center gap-1.5"
                              onClick={() => setIsAccountMenuOpen(false)}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
                              Admin Moderation Panel
                            </Link>
                          </li>
                        )}
                        {isAuthenticated && (
                          <li className="pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                logout();
                                setIsAccountMenuOpen(false);
                              }}
                              className="text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Out
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Quick Link */}
            <Link
              to="/orders"
              className="hidden lg:flex flex-col px-2 py-1.5 rounded hover:outline-1 hover:outline-white/30 text-left transition-all"
            >
              <span className="text-[11px] text-[#A3B899] font-medium leading-tight">Returns</span>
              <span className="text-[13px] font-bold text-white leading-tight">& Orders</span>
            </Link>

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:outline-1 hover:outline-white/30 text-white relative transition-all"
              aria-label={`Shopping cart with ${totalItemCount} items`}
            >
              <div className="relative">
                <ShoppingCart className="w-8 h-8 text-white" />
                <span className="absolute -top-1 left-3.5 bg-[#E07A5F] text-white text-xs font-black min-w-[20px] text-center px-1 rounded-full border border-[#122620]">
                  {totalItemCount}
                </span>
              </div>
              <span className="hidden sm:inline text-[13px] font-bold mt-2">
                Cart
              </span>
            </Link>

          </div>

        </div>

        {/* ROW 2: MOBILE SEARCH BAR */}
        <div className="md:hidden px-3 pb-2 pt-0.5">
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex items-stretch w-full h-9 rounded-md overflow-hidden bg-white shadow-xs"
          >
            <input
              type="text"
              placeholder="Search campus thrift..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 text-xs text-[#122620] placeholder:text-gray-500 outline-none"
            />
            <button
              type="submit"
              className="bg-[#E07A5F] hover:bg-[#C86449] text-white px-4 flex items-center justify-center cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* MOBILE LOCATION STRIP */}
        <div 
          onClick={() => setIsLocationModalOpen(true)}
          className="lg:hidden bg-[#1D3B32] text-white px-3 py-1.5 text-xs flex items-center gap-1.5 border-t border-white/10 cursor-pointer truncate"
        >
          <MapPin className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
          <span className="text-[#A3B899]">Deliver to</span>
          <span className="font-bold truncate text-white">
            {deliveryLocation.recipientName} - {deliveryLocation.campus || 'North Campus'}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-300 shrink-0 ml-auto" />
        </div>

      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </>
  );
}
