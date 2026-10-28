import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ShieldCheck, 
  Building, 
  Plus, 
  Check, 
  Leaf, 
  Phone, 
  Mail, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Store,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

const AVATAR_PRESETS = [
  { label: 'Campus Scholar', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80' },
  { label: 'Design Student', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
  { label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80' },
  { label: 'Bio Researcher', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { label: 'Eco Volunteer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { label: 'Campus Artist', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80' },
];

export function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'addresses' | 'wishlist'

  // Editable Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [campus, setCampus] = useState(user?.campus || 'North Campus Hub');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0].url);

  // Address State
  const [addresses, setAddresses] = useState(user?.savedAddresses || []);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrName, setNewAddrName] = useState('Hostel Room Delivery');
  const [newAddrLine1, setNewAddrLine1] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('New Delhi');
  const [newAddrPincode, setNewAddrPincode] = useState('110007');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.phone || '+91 98765 43210');
  const [newAddrPickupSpot, setNewAddrPickupSpot] = useState('Central Library Steps');

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCampus(user.campus || 'North Campus Hub');
      if (user.avatar) setAvatar(user.avatar);
      if (user.savedAddresses) setAddresses(user.savedAddresses);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Full Name is required.');
      return;
    }
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        campus: campus.trim(),
        avatar: avatar.trim(),
      });
      setSaveSuccess('Profile updated successfully! All changes saved to your account.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddrLine1.trim()) return;

    const newAddr = {
      id: 'addr-' + Date.now().toString(36),
      name: newAddrName.trim() || 'Campus Delivery Spot',
      line1: newAddrLine1.trim(),
      city: newAddrCity.trim(),
      state: 'Delhi',
      pincode: newAddrPincode.trim(),
      phone: newAddrPhone.trim(),
      pickupSpot: newAddrPickupSpot.trim(),
      isDefault: addresses.length === 0,
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setIsAddingAddress(false);
    setNewAddrLine1('');

    try {
      await updateUserProfile({ savedAddresses: updated });
      setSaveSuccess('New delivery spot added to your account.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      console.warn('Failed to persist address update:', err);
    }
  };

  const handleDeleteAddress = async (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    try {
      await updateUserProfile({ savedAddresses: updated });
    } catch (err) {
      console.warn('Failed to delete address:', err);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    try {
      await updateUserProfile({ savedAddresses: updated });
    } catch (err) {
      console.warn('Failed to set default address:', err);
    }
  };

  const handleMoveToCart = (product) => {
    addToCart(product, 1, { mode: 'buy' });
    removeFromWishlist(product.id || product._id);
  };

  return (
    <div className="space-y-6 pb-16 select-none text-[#122620] max-w-5xl mx-auto">
      
      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-white rounded-lg border border-[#E6E4DD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-[#1D3B32] text-white flex items-center justify-center text-3xl font-black shrink-0 border-3 border-[#E07A5F] overflow-hidden shadow-md">
              {avatar ? (
                <img src={avatar} alt={name || 'Student'} className="w-full h-full object-cover" />
              ) : (
                (name || 'S').charAt(0)
              )}
            </div>
            <button
              onClick={() => setActiveTab('account')}
              className="absolute bottom-0 right-0 p-1.5 bg-[#E07A5F] text-white rounded-full shadow-md hover:bg-[#C86449] transition-transform hover:scale-110 cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#122620]">{name || 'Campus Student'}</h1>
              <span className="px-2.5 py-0.5 bg-[#DCFCE7] text-[#15803D] font-bold text-[11px] rounded-full border border-[#BBF7D0] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                <span>Verified Campus Member</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{user?.email || 'student@campus.edu'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#5C635E] pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-[#2A6F4E]">
                <MapPin className="w-3.5 h-3.5 text-[#E07A5F]" />
                {campus || 'North Campus Hub'}
              </span>
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
          <Link
            to="/orders"
            className="flex-1 sm:flex-initial text-center px-4 py-2 bg-[#F6F5F0] hover:bg-gray-200 border border-[#E6E4DD] rounded-full text-xs font-bold text-[#122620] transition-colors flex items-center justify-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-[#2A6F4E]" />
            <span>My Orders</span>
          </Link>
          <Link
            to="/seller"
            className="flex-1 sm:flex-initial text-center px-4 py-2 bg-[#1D3B32] hover:bg-[#122620] text-white rounded-full text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Seller Studio</span>
          </Link>
        </div>
      </div>

      {/* 2. TABS NAVIGATION */}
      <div className="flex gap-2 border-b border-[#E6E4DD] pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs font-extrabold'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <User className="w-4 h-4 text-[#E07A5F]" />
          <span>My Profile & Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs font-extrabold'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <MapPin className="w-4 h-4 text-[#2A6F4E]" />
          <span>Saved Pickup Spots ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs font-extrabold'
              : 'text-gray-500 hover:text-black'
          }`}
        >
          <Heart className="w-4 h-4 text-[#CC0C39]" />
          <span>Campus Wishlist ({wishlist.length})</span>
        </button>
      </div>

      {/* Status Messages */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-800 flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-md text-xs text-red-700 flex items-center gap-2 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-bold">{saveError}</span>
        </div>
      )}

      {/* 3. TAB 1: EDIT PROFILE FORM */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-lg border border-[#E6E4DD] p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#122620]">Account Profile Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your personal details, campus hostel location, contact number, and profile picture.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            
            {/* Avatar Selection Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#122620]">
                Profile Photo (Select a Preset or Paste Image URL)
              </label>
              
              <div className="flex flex-wrap gap-2.5 items-center">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === preset.url
                        ? 'border-[#E07A5F] ring-2 ring-[#E07A5F] scale-105'
                        : 'border-[#E6E4DD] hover:border-gray-400 opacity-80 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    {avatar === preset.url && (
                      <div className="absolute inset-0 bg-[#E07A5F]/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 max-w-md">
                <input
                  type="url"
                  placeholder="Or paste custom image URL (https://...)"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F5F0] border border-[#E6E4DD] rounded text-xs outline-none focus:bg-white focus:border-[#D97706] font-medium"
                />
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#122620] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Student Name"
                  className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] font-medium"
                />
              </div>

              {/* Campus Email (Read-Only) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#122620]">Campus Email (Locked)</label>
                  <span className="text-[10px] text-gray-500 font-semibold">Institutional Verified</span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'student@campus.edu'}
                    className="w-full px-3 py-2 bg-gray-100 border border-[#E6E4DD] rounded text-xs text-gray-600 cursor-not-allowed font-medium pl-8"
                  />
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#122620] mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] font-medium pl-8"
                  />
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Used for coordinating physical handovers on campus.</p>
              </div>

              {/* Campus Zone / Hostel Block */}
              <div>
                <label className="block text-xs font-bold text-[#122620] mb-1">
                  Campus Zone / Hostel Block *
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6E4DD] rounded text-xs outline-none focus:border-[#D97706] font-medium"
                >
                  <option value="North Campus Hub">North Campus Hub</option>
                  <option value="North Campus, Hostel Block A">North Campus, Hostel Block A</option>
                  <option value="South Campus Hostel 4">South Campus Hostel 4</option>
                  <option value="Engineering Quad">Engineering Quad</option>
                  <option value="Student Activity Center">Student Activity Center</option>
                  <option value="Central Library & Quad">Central Library & Quad</option>
                  <option value="Central Administration">Central Administration</option>
                </select>
                <p className="text-[10px] text-gray-500 mt-0.5">Primary delivery & meetup radius for peer exchanges.</p>
              </div>

            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>

              <p className="text-[11px] text-gray-500">
                Changes take effect immediately across all devices.
              </p>
            </div>

          </form>
        </div>
      )}

      {/* 4. TAB 2: SAVED PICKUP SPOTS & ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-lg border border-[#E6E4DD] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#122620]">Your Saved Campus & Delivery Locations</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Convenient pickup points and dorm addresses for peer-to-peer handovers.
              </p>
            </div>

            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="px-4 py-2 bg-[#1D3B32] hover:bg-[#122620] text-white rounded-full text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>{isAddingAddress ? 'Cancel' : 'Add New Spot'}</span>
            </button>
          </div>

          {/* New Address Form */}
          {isAddingAddress && (
            <form onSubmit={handleAddAddress} className="p-4 bg-[#F6F5F0] rounded-lg border border-[#E6E4DD] space-y-3">
              <h3 className="text-xs font-bold text-[#122620] uppercase tracking-wider">Add New Delivery Location</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Spot Name / Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Quad or Hostel Room 204"
                    value={newAddrName}
                    onChange={(e) => setNewAddrName(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Campus Handover Landmark *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Cafeteria Counter 2"
                    value={newAddrPickupSpot}
                    onChange={(e) => setNewAddrPickupSpot(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Full Address / Hostel Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostel 5, 2nd Floor, Room 218, South Campus"
                    value={newAddrLine1}
                    onChange={(e) => setNewAddrLine1(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={newAddrPincode}
                    onChange={(e) => setNewAddrPincode(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          )}

          {/* Saved Addresses List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="border border-[#E6E4DD] rounded-lg p-4 space-y-2 text-xs relative hover:shadow-xs transition-shadow bg-white">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-[#122620] flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#2A6F4E]" />
                    {addr.name}
                  </span>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] font-bold text-[10px] rounded-full border border-[#BBF7D0]">
                      Default Spot
                    </span>
                  )}
                </div>

                <p className="text-gray-700 font-medium">{addr.line1}</p>
                <p className="text-gray-500">{addr.city}, Delhi - {addr.pincode}</p>
                {addr.phone && <p className="text-gray-500">Contact: {addr.phone}</p>}
                
                {addr.pickupSpot && (
                  <div className="p-2 bg-[#F6F5F0] rounded text-[11px] text-[#2A6F4E] font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                    <span>Meetup Spot: {addr.pickupSpot}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[#2A6F4E] hover:underline font-bold cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-gray-400 font-medium">Primary location</span>
                  )}

                  {addresses.length > 1 && (
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="bg-white rounded-lg border border-[#E6E4DD] p-6 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-[#122620]">Your Saved Campus Wishlist</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Items you've bookmarked for future semesters or semester-end study groups.
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <Heart className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-[#122620]">Your campus wishlist is empty</p>
              <p className="text-xs max-w-sm mx-auto">
                Click the heart icon on any product card in the marketplace to save items for later.
              </p>
              <Link
                to="/products"
                className="inline-block mt-2 px-5 py-2 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs rounded-full shadow-2xs transition-all"
              >
                Explore Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map((item) => (
                <div key={item.id || item._id} className="border border-[#E6E4DD] rounded-md p-3 flex flex-col justify-between text-xs space-y-2 hover:shadow-sm transition-shadow bg-white">
                  <Link to={`/product/${item.id || item._id}`} className="aspect-square bg-[#F9F8F5] rounded flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="space-y-1">
                    <h3 className="font-bold text-[#122620] line-clamp-1">{item.title}</h3>
                    <p className="font-extrabold text-[#E07A5F]">{formatCurrency(item.price)}</p>
                  </div>

                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="flex-1 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold rounded text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id || item._id)}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:text-red-600 rounded cursor-pointer transition-colors"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
