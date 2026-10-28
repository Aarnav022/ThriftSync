import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  X, 
  User, 
  ChevronRight, 
  Flame, 
  ShoppingBag, 
  BookOpen, 
  Home as HomeIcon, 
  Headphones, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  Gift,
  PlusCircle,
  Package,
  Repeat,
  Leaf,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileDrawer({ isOpen, onClose }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavClick = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative w-[85%] max-w-[340px] h-full bg-white shadow-2xl flex flex-col z-10 transform transition-transform duration-300 overflow-y-auto">
        
        {/* Drawer Header */}
        <div className="bg-[#1D3B32] text-white px-5 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              {isAuthenticated && user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-200" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-[#A3B899] uppercase tracking-wider font-bold">
                {isAuthenticated ? (user.campus || 'Campus Member') : 'Welcome to ThriftSync'}
              </p>
              <h2 className="text-sm font-bold text-white flex items-center gap-1 leading-tight">
                {isAuthenticated ? user.name : 'Hello, Sign In'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-2 text-[#122620] divide-y divide-[#E6E4DD]">
          
          {/* Action: Switch to Seller Studio */}
          <div className="p-4 bg-[#F6F5F0]">
            <button
              onClick={() => handleNavClick('/seller')}
              className="w-full py-2 px-3 bg-[#1D3B32] hover:bg-[#254B40] text-white font-bold text-xs rounded-md shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#E07A5F]" />
              <span>Campus Seller Studio</span>
            </button>
          </div>

          {/* Trending & Quick Sections */}
          <div className="py-3 px-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Trending
            </h3>
            <ul className="space-y-1 text-xs font-semibold">
              <li>
                <button
                  onClick={() => handleNavClick('/products?deals=true')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#E07A5F]" /> Campus Deals & Steals
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/products?listingType=rent')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-[#2A6F4E]" /> Semester Rentals
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
            </ul>
          </div>

          {/* Shop by Department */}
          <div className="py-3 px-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Shop by Department
            </h3>
            <ul className="space-y-1 text-xs font-semibold">
              <li>
                <button
                  onClick={() => handleNavClick('/products?category=Textbooks')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#2A6F4E]" /> Textbooks & Course Packs
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/products?category=Fashion')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#2A6F4E]" /> Fashion & Upcycled Clothes
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/products?category=Electronics')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#2A6F4E]" /> Electronics & Calculators
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/products?category=Dorm%20%26%20Living')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HomeIcon className="w-4 h-4 text-[#2A6F4E]" /> Dorm Essentials & Decor
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
            </ul>
          </div>

          {/* Student Account & Orders */}
          <div className="py-3 px-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              My Student Account
            </h3>
            <ul className="space-y-1 text-xs font-medium">
              <li>
                <button
                  onClick={() => handleNavClick('/orders')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-600" /> My Orders & Handover Status
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/profile')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" /> Profile & Saved Addresses
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/cart')}
                  className="w-full flex items-center justify-between py-2 text-left hover:text-[#2A6F4E] cursor-pointer"
                >
                  <span>Shopping Cart</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
              {isAdmin && (
                <li className="pt-2">
                  <button
                    onClick={() => handleNavClick('/admin')}
                    className="w-full flex items-center justify-between py-2 text-left text-[#1D3B32] font-black cursor-pointer bg-emerald-50 px-2 rounded border border-emerald-200"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#E07A5F]" /> Admin Moderation Panel
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Auth Actions */}
          <div className="py-3 px-5">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center gap-2 py-2 text-red-600 hover:text-red-700 text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/login')}
                className="w-full flex items-center gap-2 py-2 text-[#2A6F4E] hover:text-[#122620] text-xs font-bold cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In to Campus Account
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
