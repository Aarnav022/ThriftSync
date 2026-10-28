import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Zap, Sparkles, Repeat, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function SubHeader({ onOpenDrawer }) {
  const { isAdmin } = useAuth();

  const quickCategories = [
    { name: "Campus Deals", href: "/products?deals=true", highlight: true },
    { name: "Textbooks", href: "/products?category=Textbooks" },
    { name: "Fashion & Thrift", href: "/products?category=Fashion" },
    { name: "Electronics", href: "/products?category=Electronics" },
    { name: "Dorm & Living", href: "/products?category=Dorm%20%26%20Living" },
    { name: "Student Rentals", href: "/products?listingType=rent", isRental: true },
    { name: "My Orders", href: "/orders" },
  ];

  return (
    <div className="bg-[#1D3B32] text-white text-xs lg:text-sm select-none border-b border-[#122620]/30 shadow-xs">
      <div className="max-w-[1500px] mx-auto px-2 lg:px-4 flex items-center justify-between h-[39px]">
        
        {/* Left Links & All Menu Trigger */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {/* "All" button triggers the slide-over MobileDrawer */}
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:outline-1 hover:outline-white/30 font-bold shrink-0 cursor-pointer text-white"
          >
            <Menu className="w-4 h-4 text-white" />
            <span>All</span>
          </button>

          {/* Quick links */}
          <nav className="flex items-center gap-1 whitespace-nowrap">
            {quickCategories.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-2 py-1 rounded hover:outline-1 hover:outline-white/30 transition-all text-[13px] font-medium flex items-center gap-1 ${
                  item.highlight ? 'text-[#E07A5F] font-bold' : 'text-gray-100 hover:text-white'
                }`}
              >
                {item.highlight && <Zap className="w-3.5 h-3.5 text-[#E07A5F]" />}
                {item.isRental && <Repeat className="w-3.5 h-3.5 text-[#A3B899]" />}
                <span>{item.name}</span>
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="px-2 py-1 rounded bg-[#122620] text-[#E07A5F] hover:outline-1 hover:outline-white/30 transition-all text-[12px] font-bold flex items-center gap-1 ml-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right side campus sustainability tagline */}
        <div className="hidden lg:flex items-center gap-1 px-2 py-1 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#A3B899]">
            <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Sustainable Campus Circular Economy • 100% Peer Verified</span>
          </span>
        </div>

      </div>
    </div>
  );
}
