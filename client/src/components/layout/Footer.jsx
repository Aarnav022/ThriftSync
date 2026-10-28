import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Leaf, ShieldCheck, HeartHandshake } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="select-none text-[#DDD] text-xs">
      
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#122620] hover:bg-[#1D3B32] text-white py-3.5 text-center text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-t border-[#1D3B32]"
        aria-label="Scroll back to top of page"
      >
        <ArrowUp className="w-4 h-4 text-[#E07A5F]" />
        <span>Back to top</span>
      </button>

      {/* Main 4-column Links Section */}
      <div className="bg-[#1D3B32] border-b border-[#122620]/40 py-10">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#E07A5F]" />
              <span>Campus Community</span>
            </h4>
            <ul className="space-y-2 text-[#C4D1C0]">
              <li><Link to="/products" className="hover:underline">Browse All Listings</Link></li>
              <li><Link to="/products?category=Textbooks" className="hover:underline">Textbook Exchange</Link></li>
              <li><Link to="/products?category=Fashion" className="hover:underline">Vintage & Upcycled Apparel</Link></li>
              <li><Link to="/products?category=Dorm%20%26%20Living" className="hover:underline">Dorm Appliances & Decor</Link></li>
              <li><Link to="/products?listingType=rent" className="hover:underline">Semester Rentals</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Student Hub</h4>
            <ul className="space-y-2 text-[#C4D1C0]">
              <li><Link to="/sell" className="hover:underline">List an Item to Sell / Rent</Link></li>
              <li><Link to="/orders" className="hover:underline">My Active Orders</Link></li>
              <li><Link to="/profile" className="hover:underline">Saved Pickup Addresses</Link></li>
              <li><Link to="/cart" className="hover:underline">Shopping Bag & Rentals</Link></li>
              <li><a href="#meetup-guidelines" className="hover:underline">Campus Meetup Guidelines</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-[#C4D1C0]">
              <li><span className="text-gray-300">100% Peer Verified Reviews</span></li>
              <li><span className="text-gray-300">Designated Safe Handover Zones</span></li>
              <li><span className="text-gray-300">Refundable Rental Deposits</span></li>
              <li><span className="text-gray-300">Admin Item Moderation</span></li>
              <li><span className="text-gray-300">Campus Identity Badges</span></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Help & Quick Links</h4>
            <ul className="space-y-2 text-[#C4D1C0]">
              <li><Link to="/login" className="hover:underline">Student Sign In</Link></li>
              <li><Link to="/register" className="hover:underline">Register Campus Account</Link></li>
              <li>
                <Link to="/admin/login" className="text-[#E07A5F] hover:text-white font-bold flex items-center gap-1 hover:underline">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal Login →</span>
                </Link>
              </li>
              <li><Link to="/admin" className="hover:underline">Admin Moderation Panel</Link></li>
              <li><a href="#" className="hover:underline">Support & FAQs</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Middle Brand Bar */}
      <div className="bg-[#1D3B32] py-5 px-4 border-b border-[#122620]/50">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-[#C4D1C0]">
          <Link to="/" className="flex items-center gap-1.5">
            <Leaf className="w-5 h-5 text-[#E07A5F]" />
            <span className="text-xl font-black text-white">
              Thrift<span className="text-[#E07A5F]">Sync</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 border border-[#2A6F4E] rounded px-3 py-1.5 bg-[#122620]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span className="text-white font-semibold">100% Student Verified Campus Network</span>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="bg-[#122620] py-6 px-4 text-center text-[#8E9B89] space-y-2">
        <div className="flex flex-wrap justify-center gap-4 text-[11px]">
          <a href="#" className="hover:underline">Campus Code of Conduct</a>
          <a href="#" className="hover:underline">Safe Handover Guidelines</a>
          <a href="#" className="hover:underline">Rental Terms & Deposit Policy</a>
          <a href="#" className="hover:underline">Privacy Notice</a>
          <Link to="/admin/login" className="text-[#E07A5F] hover:underline font-bold">
            Admin Portal Login →
          </Link>
        </div>
        <p className="text-[11px] text-[#707E6C]">
          © 2026 ThriftSync. Sustainable Campus Exchange & Local Marketplace. All rights reserved.
        </p>
      </div>

    </footer>
  );
}
