import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Store,
  PlusCircle, 
  Trash2, 
  Edit3,
  CheckCircle2, 
  Leaf, 
  Repeat, 
  Package, 
  ShieldCheck,
  AlertCircle,
  MapPin,
  Clock,
  ArrowLeft,
  DollarSign,
  User,
  ShoppingBag,
  ExternalLink,
  Info
} from 'lucide-react';
import { createListing, fetchMyListings, deleteListing, updateListing } from '../services/productService';
import { fetchSellerOrders, confirmOrder, confirmHandover } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import { ConditionBadge } from '../components/common/ConditionBadge';
import { useAuth } from '../context/AuthContext';

const PRESET_IMAGES = [
  { label: 'DSA Notes & Textbook', url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800&q=80' },
  { label: 'Engineering Math', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80' },
  { label: 'Vintage Flannel Shirt', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
  { label: 'Campus Graphic Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80' },
  { label: 'Upcycled Denim Tote', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80' },
  { label: 'LED Study Desk Lamp', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80' }
];

export function SellPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'inventory' | 'add' | 'orders'
  const [activeTab, setActiveTab] = useState('inventory');

  // Inventory State
  const [myListings, setMyListings] = useState([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  // Incoming Orders State
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [condition, setCondition] = useState('Good');
  const [listingType, setListingType] = useState('buy_and_rent');
  const [price, setPrice] = useState('180');
  const [rentalRate, setRentalRate] = useState('15');
  const [rentalPeriod, setRentalPeriod] = useState('per day');
  const [deposit, setDeposit] = useState('60');
  const [totalStock, setTotalStock] = useState('1');
  const [pickupLocation, setPickupLocation] = useState('Central Library Steps');
  const [campus, setCampus] = useState(user?.campus || 'North Campus Hub');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Quick edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const loadInventory = async () => {
    setIsInventoryLoading(true);
    try {
      const data = await fetchMyListings();
      setMyListings(data);
    } catch (err) {
      console.warn('Failed to fetch seller inventory:', err?.message);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const loadIncomingOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const orders = await fetchSellerOrders();
      setIncomingOrders(orders);
    } catch (err) {
      console.warn('Failed to fetch incoming orders:', err?.message);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInventory();
      loadIncomingOrders();
    }
  }, [isAuthenticated]);

  // Form Submit: Add New Listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !price) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    const numPrice = parseFloat(price) || 0;
    if (numPrice < 50 || numPrice > 1000) {
      setErrorMessage('Student Buy Price must be between ₹50 and ₹1,000 to keep items accessible.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      listingType,
      price: numPrice,
      pricePaise: Math.round(numPrice * 100),
      rentalRate: listingType.includes('rent') ? parseFloat(rentalRate) || 15 : undefined,
      rentalPeriod: listingType.includes('rent') ? rentalPeriod : undefined,
      deposit: listingType.includes('rent') ? parseFloat(deposit) || 60 : undefined,
      totalStock: parseInt(totalStock, 10) || 1,
      availableStock: parseInt(totalStock, 10) || 1,
      pickupLocation,
      campus,
      images: [imageUrl.trim()],
    };

    try {
      await createListing(payload);
      setSuccessMessage('Listing successfully created and published to the campus storefront!');
      setTitle('');
      setDescription('');
      await loadInventory();
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('inventory');
      }, 1500);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to publish listing. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Listing
  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to remove this item from your seller inventory?')) return;
    try {
      await deleteListing(listingId);
      setMyListings((prev) => prev.filter((p) => (p.id || p._id) !== listingId));
    } catch (err) {
      alert('Could not delete listing: ' + (err?.message || 'Server error'));
    }
  };

  // Quick Edit Save
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      const updated = await updateListing(editingItem.id || editingItem._id, {
        price: parseFloat(editPrice) || editingItem.price,
        availableStock: parseInt(editStock, 10) || editingItem.stockCount,
      });
      setMyListings((prev) =>
        prev.map((item) => (item.id === (editingItem.id || editingItem._id) ? { ...item, price: parseFloat(editPrice), stockCount: parseInt(editStock, 10) } : item))
      );
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update listing: ' + (err?.message || 'Server error'));
    }
  };

  // Accept / Confirm Handover Order
  const handleConfirmOrder = async (orderId) => {
    try {
      await confirmOrder(orderId, {
        pickupLocation: 'Central Library Steps',
        meetupNotes: 'Seller confirmed meetup point',
      });
      loadIncomingOrders();
    } catch (err) {
      alert('Failed to confirm order: ' + (err?.message || 'Server error'));
    }
  };

  // Complete Handover Order
  const handleMarkHandoverDone = async (orderId) => {
    try {
      await confirmHandover(orderId, 'Seller verified physical handover and payment received');
      loadIncomingOrders();
    } catch (err) {
      alert('Failed to complete handover: ' + (err?.message || 'Server error'));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-lg border border-[#E6E4DD] text-center space-y-4 shadow-sm">
        <Store className="w-12 h-12 text-[#E07A5F] mx-auto" />
        <h2 className="text-xl font-bold text-[#122620]">Campus Seller Hub</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          Please sign in with a campus seller account to access your inventory, upload items, and manage incoming student orders.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-2.5 bg-[#1D3B32] hover:bg-[#122620] text-white rounded-full font-bold text-xs shadow-xs"
        >
          Sign In to Seller Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 select-none text-[#122620]">
      
      {/* 1. SELLER STUDIO DEDICATED HEADER */}
      <div className="bg-[#1D3B32] text-white rounded-lg p-5 sm:p-6 shadow-md border border-[#122620] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E07A5F] text-white rounded-md">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Campus Seller Studio
            </h1>
            <span className="bg-[#2A6F4E] text-[#DCFCE7] text-[10px] font-bold px-2 py-0.5 rounded-full">
              Live Studio
            </span>
          </div>
          <p className="text-xs text-[#A3B899]">
            Logged in as <strong className="text-white">{user?.name}</strong> • Zone: {user?.campus || 'North Campus Hub'}
          </p>
        </div>

        {/* Back to Storefront Button (Switch to Buyer Mode) */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-bold transition-all border border-white/20"
            title="Return to Student Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Marketplace</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#E6E4DD] shadow-2xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Listings</p>
          <p className="text-2xl font-black text-[#122620] mt-1">{myListings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E6E4DD] shadow-2xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Incoming Orders</p>
          <p className="text-2xl font-black text-[#E07A5F] mt-1">{incomingOrders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#E6E4DD] shadow-2xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Exchange Status</p>
          <p className="text-2xl font-black text-[#2A6F4E] mt-1">100% Verified</p>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E6E4DD] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs'
              : 'text-gray-500 hover:text-[#122620]'
          }`}
        >
          <Package className="w-4 h-4 text-[#2A6F4E]" />
          <span>My Listings</span>
          <span className="px-1.5 py-0.2 bg-gray-100 rounded text-[10px] text-gray-600">
            {myListings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'add'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs'
              : 'text-gray-500 hover:text-[#122620]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-[#E07A5F]" />
          <span>List New Campus Item</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            loadIncomingOrders();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-md transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white border-b-2 border-[#E07A5F] text-[#122620] shadow-2xs'
              : 'text-gray-500 hover:text-[#122620]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#1D3B32]" />
          <span>Incoming Buyer Orders</span>
          {incomingOrders.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#E07A5F] text-white rounded-full text-[10px] font-bold">
              {incomingOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MY INVENTORY */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg border border-[#E6E4DD] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#122620]">Your Active Listings</h2>
              <p className="text-xs text-gray-500">Manage items currently listed on the student marketplace</p>
            </div>
            <button
              onClick={() => setActiveTab('add')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white rounded text-xs font-bold cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Item</span>
            </button>
          </div>

          {isInventoryLoading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading your inventory...</div>
          ) : myListings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-bold text-sm text-[#122620]">No items in your seller inventory</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Turn your old semester textbooks or clothes into cash by listing them at affordable student rates.
              </p>
              <button
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 bg-[#E07A5F] text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
              >
                List Your First Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F5F0] text-gray-600 font-bold border-b border-[#E6E4DD]">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-3">Condition</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Student Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  {myListings.map((item) => {
                    const itemId = item.id || item._id;
                    return (
                      <tr key={itemId} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=200&q=80'}
                            alt={item.title}
                            className="w-10 h-10 rounded object-cover border border-[#E6E4DD] shrink-0"
                          />
                          <div className="max-w-[200px] sm:max-w-xs">
                            <Link to={`/product/${itemId}`} className="font-bold text-[#122620] hover:text-[#2A6F4E] truncate block">
                              {item.title}
                            </Link>
                            <span className="text-[10px] text-gray-500">{item.category} • {item.pickupLocation}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <ConditionBadge condition={item.condition} />
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700 capitalize">
                          {item.listingType === 'buy_and_rent' ? 'Buy & Rent' : item.listingType}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#122620]">
                          <div>Buy: {formatCurrency(item.price)}</div>
                          {item.isRentable && (
                            <div className="text-[11px] text-[#2A6F4E] font-medium">
                              Rent: {formatCurrency(item.rentalRate)}/day
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700">
                          {item.stockCount} left
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            APPROVED / LIVE
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditPrice(item.price.toString());
                              setEditStock(item.stockCount.toString());
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#122620] hover:bg-gray-100 rounded cursor-pointer"
                            title="Edit Price/Stock"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(itemId)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete / Archive Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ADD NEW LISTING */}
      {/* ======================================================== */}
      {activeTab === 'add' && (
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Affordable Student Pricing Guide Banner */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs space-y-1.5 text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-[#1D3B32]">
              <Info className="w-4 h-4 text-[#2A6F4E]" />
              <span>Affordable Campus Pricing Guidelines</span>
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Students have limited budgets. Items priced fairly sell within 48 hours:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <li className="bg-white/80 p-2 rounded border border-emerald-100">
                <strong>Textbooks & Notes:</strong> ₹80 – ₹200
              </li>
              <li className="bg-white/80 p-2 rounded border border-emerald-100">
                <strong>Thrift Clothes:</strong> ₹150 – ₹350
              </li>
              <li className="bg-white/80 p-2 rounded border border-emerald-100">
                <strong>Rentals:</strong> ₹10 – ₹25/day (₹50–₹100 deposit)
              </li>
            </ul>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg border border-[#E6E4DD] p-6 shadow-xs text-xs space-y-4">
            <h2 className="text-base font-bold text-[#122620] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#E07A5F]" />
              <span>Listing Details</span>
            </h2>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2A6F4E] shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Engineering Math Notes or Vintage Flannel Shirt (M)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none focus:border-[#D97706] text-xs font-medium"
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Department *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none bg-white font-medium"
                  >
                    <option value="Textbooks">Textbooks</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Dorm & Living">Dorm & Living</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Item Condition *</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none bg-white font-medium"
                  >
                    <option value="Like New">Like New (Practically untouched)</option>
                    <option value="Excellent">Excellent (Minor signs of use)</option>
                    <option value="Good">Good (Usable, regular campus wear)</option>
                    <option value="Fair">Fair (Noticeable wear but intact)</option>
                  </select>
                </div>
              </div>

              {/* Exchange Mode */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Exchange Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'buy', label: 'Outright Sale' },
                    { id: 'rent', label: 'Rental Only' },
                    { id: 'buy_and_rent', label: 'Both Buy & Rent' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setListingType(t.id)}
                      className={`py-2 px-2 rounded border font-bold text-center cursor-pointer transition-all ${
                        listingType === t.id
                          ? 'border-[#2A6F4E] bg-emerald-50 text-[#2A6F4E] ring-1 ring-[#2A6F4E]'
                          : 'border-[#E6E4DD] bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Budget Pricing Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F6F5F0] rounded-md border border-[#E6E4DD]">
                {listingType !== 'rent' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Buy Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={50}
                      max={1000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Budget: ₹50–₹500</p>
                  </div>
                )}

                {listingType !== 'buy' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Rent Rate (₹/day) *</label>
                    <input
                      type="number"
                      min={10}
                      max={30}
                      value={rentalRate}
                      onChange={(e) => setRentalRate(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Budget: ₹10–₹30/day</p>
                  </div>
                )}

                {listingType !== 'buy' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Deposit (₹) *</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="e.g. 60"
                      className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">Max ₹100 deposit</p>
                  </div>
                )}

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={totalStock}
                    onChange={(e) => setTotalStock(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Usually 1-3 items</p>
                </div>
              </div>

              {/* Handover Spot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Campus Hub *</label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none bg-white font-medium"
                  >
                    <option value="North Campus Hub">North Campus Hub</option>
                    <option value="South Campus Hostel 4">South Campus Hostel 4</option>
                    <option value="Engineering Quad">Engineering Quad</option>
                    <option value="Student Activity Center">Student Activity Center</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Safe Pickup Location *</label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Central Library Steps, Hostel 4 Gate"
                    className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none focus:border-[#D97706] font-medium"
                  />
                </div>
              </div>

              {/* Photo Presets & URL */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Item Image Preset</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-colors ${
                        imageUrl === preset.url
                          ? 'bg-[#1D3B32] text-white border-[#1D3B32]'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-[#E6E4DD]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 border border-[#E6E4DD] rounded outline-none text-xs text-gray-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item: condition, semester used, highlights, reason for selling..."
                  className="w-full p-2.5 border border-[#E6E4DD] rounded outline-none focus:border-[#D97706] text-xs font-medium"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] text-white font-bold rounded-full shadow-2xs cursor-pointer text-xs transition-colors"
              >
                {isSubmitting ? 'Publishing Listing...' : 'Publish Campus Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: INCOMING ORDERS */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-[#E6E4DD] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6E4DD] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#122620]">Incoming Buyer Orders</h2>
              <p className="text-xs text-gray-500">Orders placed by campus students waiting for your handover acceptance</p>
            </div>
            <button
              onClick={loadIncomingOrders}
              className="text-xs text-[#2A6F4E] hover:underline font-bold cursor-pointer"
            >
              Refresh Orders
            </button>
          </div>

          {isOrdersLoading ? (
            <div className="p-12 text-center text-xs text-gray-500">Loading incoming buyer orders...</div>
          ) : incomingOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-bold text-sm text-[#122620]">No incoming buyer orders yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Once a student chooses to buy or rent one of your listed items, their handover request will appear here for your confirmation.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6E4DD]">
              {incomingOrders.map((ord) => {
                const orderId = ord._id || ord.id;
                const buyerName = ord.buyer?.name || ord.shippingAddress?.fullName || 'Campus Student';
                const itemTitle = ord.items?.[0]?.title || ord.listing?.title || 'Campus Item';
                const itemImg = ord.items?.[0]?.image || ord.listing?.images?.[0] || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=200&q=80';
                const status = ord.status || ord.orderStatus || 'PENDING';

                return (
                  <div key={orderId} className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <img
                        src={itemImg}
                        alt={itemTitle}
                        className="w-14 h-14 rounded object-cover border border-[#E6E4DD] shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-500">
                            #{orderId.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-[#122620]">{itemTitle}</h3>
                        <p className="text-xs text-gray-600">
                          Buyer: <strong>{buyerName}</strong> • {ord.buyer?.campus || 'Campus Hub'}
                        </p>
                        <p className="text-[11px] text-[#2A6F4E] font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#E07A5F]" />
                          <span>Meetup: {ord.pickupLocation || 'Student Center Desk'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-gray-500">Order Amount</div>
                        <div className="text-base font-black text-[#122620]">
                          {formatCurrency(ord.totalAmount || (ord.totalPaise ? ord.totalPaise / 100 : 0))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirmOrder(orderId)}
                            className="px-3 py-1.5 bg-[#2A6F4E] hover:bg-[#1D3B32] text-white rounded text-xs font-bold cursor-pointer shadow-2xs"
                          >
                            Accept Handover Plan
                          </button>
                        )}
                        {status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleMarkHandoverDone(orderId)}
                            className="px-3 py-1.5 bg-[#1D3B32] hover:bg-[#122620] text-white rounded text-xs font-bold cursor-pointer shadow-2xs"
                          >
                            Confirm Handover Completed
                          </button>
                        )}
                        {status === 'COMPLETED' && (
                          <span className="text-xs font-bold text-[#2A6F4E] flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Edit Price/Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full space-y-4 border border-[#E6E4DD] shadow-xl">
            <h3 className="font-bold text-sm text-[#122620]">Quick Edit Listing</h3>
            <p className="text-xs text-gray-500 truncate">{editingItem.title}</p>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Buy Price (₹)</label>
                <input
                  type="number"
                  min={50}
                  max={1000}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-2 border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Stock Count</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full p-2 border border-[#E6E4DD] rounded outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-[#E07A5F] hover:bg-[#C86449] text-white rounded text-xs font-bold cursor-pointer"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
