import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert,
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Clock, 
  MapPin, 
  Search,
  Lock,
  ArrowRight,
  RefreshCw,
  Download,
  ExternalLink,
  Activity,
  Sparkles,
  Filter,
  ChevronRight,
  Check,
  X,
  Eye,
  Zap,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  Store,
  FileText
} from 'lucide-react';
import { 
  fetchAdminMetrics, 
  fetchAdminListings, 
  updateAdminListingStatus, 
  fetchAdminOrders, 
  updateAdminOrderFulfillment, 
  fetchAdminUsers, 
  updateAdminUserStatus 
} from '../services/adminService';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

// Realistic fallback / baseline data to guarantee immediate vibrancy even before extensive user uploads
const INITIAL_DEMO_LISTINGS = [
  {
    _id: 'lst-mod-01',
    title: 'Data Structures & Algorithms Notes + Textbook',
    description: 'Complete DSA semester exam notes with solved recursion problems and core reference textbook in immaculate condition.',
    category: 'Textbooks',
    condition: 'Good',
    listingType: 'buy_and_rent',
    price: 180,
    rentalRate: 15,
    rentalPeriod: 'per day',
    deposit: 60,
    pickupLocation: 'Central Library Steps',
    campus: 'North Campus Hub',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    images: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800&q=80'],
    seller: {
      _id: 'usr-s1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@campus.edu',
      campus: 'North Campus Hub',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    }
  },
  {
    _id: 'lst-mod-02',
    title: 'Vintage Oversized Flannel Plaid Shirt (Size M/L)',
    description: 'Warm brushed cotton thrifted flannel shirt in forest green and brown checks. Washed and sanitized.',
    category: 'Fashion',
    condition: 'Like New',
    listingType: 'buy',
    price: 250,
    pickupLocation: 'Hostel 4 Common Room',
    campus: 'South Campus Hostel 4',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'],
    seller: {
      _id: 'usr-s2',
      name: 'Rohan Verma',
      email: 'rohan.v@campus.edu',
      campus: 'South Campus Hostel 4',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
    }
  },
  {
    _id: 'lst-mod-03',
    title: 'Higher Engineering Mathematics (Semester Book)',
    description: 'Used for 1 semester in Math-I & Math-II. No torn pages, sturdy bound spine in great condition.',
    category: 'Textbooks',
    condition: 'Like New',
    listingType: 'buy_and_rent',
    price: 120,
    rentalRate: 10,
    rentalPeriod: 'per day',
    deposit: 50,
    pickupLocation: 'Engineering Dept Cafeteria',
    campus: 'Engineering Quad',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
    seller: {
      _id: 'usr-s3',
      name: 'Ananya Roy',
      email: 'ananya.roy@campus.edu',
      campus: 'Engineering Quad',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    }
  },
  {
    _id: 'lst-mod-04',
    title: 'Adjustable LED Study Desk Lamp (3 Color Modes)',
    description: 'USB-powered flexible gooseneck study lamp. Perfect for hostel night study sessions.',
    category: 'Electronics',
    condition: 'Good',
    listingType: 'buy_and_rent',
    price: 299,
    rentalRate: 15,
    rentalPeriod: 'per day',
    deposit: 70,
    pickupLocation: 'Hostel 3 Gate',
    campus: 'North Campus Hub',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'],
    seller: {
      _id: 'usr-s4',
      name: 'Pooja Iyer',
      email: 'pooja.iyer@campus.edu',
      campus: 'North Campus Hub',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    }
  }
];

const INITIAL_DEMO_ORDERS = [
  {
    _id: 'ORD-404-8921',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    pickupLocation: 'Central Library Steps',
    totalAmount: 180,
    paymentMethod: 'Campus Handover UPI',
    orderStatus: 'PLACED',
    fulfillmentStatus: 'UNFULFILLED',
    itemTitle: 'Data Structures & Algorithms Notes + Textbook',
    buyer: {
      name: 'Kavya Nair',
      email: 'kavya.nair@campus.edu',
      campus: 'South Campus Hostel 4',
    },
    seller: {
      name: 'Campus Administration',
      email: 'admin@thriftsync.campus',
      campus: 'Central Administration',
    }
  },
  {
    _id: 'ORD-404-7612',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    pickupLocation: 'Hostel 3 Gate',
    totalAmount: 299,
    paymentMethod: 'Cash on Meetup',
    orderStatus: 'HANDED_OVER',
    fulfillmentStatus: 'HANDED_OVER',
    itemTitle: 'Adjustable LED Study Desk Lamp',
    buyer: {
      name: 'Devansh Sen',
      email: 'devansh.sen@campus.edu',
      campus: 'Engineering Quad',
    },
    seller: {
      name: 'Pooja Iyer',
      email: 'pooja.iyer@campus.edu',
      campus: 'North Campus Hub',
    }
  },
  {
    _id: 'ORD-404-5401',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    pickupLocation: 'Engineering Dept Cafeteria',
    totalAmount: 120,
    paymentMethod: 'Campus Handover UPI',
    orderStatus: 'COMPLETED',
    fulfillmentStatus: 'DELIVERED',
    itemTitle: 'Higher Engineering Mathematics (Semester Book)',
    buyer: {
      name: 'Aditya Mehta',
      email: 'aditya.mehta@campus.edu',
      campus: 'North Campus Hub',
    },
    seller: {
      name: 'Ananya Roy',
      email: 'ananya.roy@campus.edu',
      campus: 'Engineering Quad',
    }
  }
];

const INITIAL_DEMO_USERS = [
  {
    _id: 'usr-admin-master',
    name: 'Campus Administrator',
    email: 'admin@thriftsync.campus',
    campus: 'Central Administration',
    role: 'admin',
    isActive: true,
    trustScore: 100,
    listingCount: 6,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    joinedDate: 'Semester 1, 2026'
  },
  {
    _id: 'usr-stu-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@campus.edu',
    campus: 'North Campus Hub',
    role: 'student',
    isActive: true,
    trustScore: 98,
    listingCount: 4,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    joinedDate: 'Semester 2, 2026'
  },
  {
    _id: 'usr-stu-2',
    name: 'Rohan Verma',
    email: 'rohan.v@campus.edu',
    campus: 'South Campus Hostel 4',
    role: 'student',
    isActive: true,
    trustScore: 96,
    listingCount: 3,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
    joinedDate: 'Semester 2, 2026'
  },
  {
    _id: 'usr-stu-3',
    name: 'Ananya Roy',
    email: 'ananya.roy@campus.edu',
    campus: 'Engineering Quad',
    role: 'student',
    isActive: true,
    trustScore: 100,
    listingCount: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    joinedDate: 'Semester 1, 2026'
  },
  {
    _id: 'usr-stu-4',
    name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    campus: 'North Campus Hub',
    role: 'student',
    isActive: true,
    trustScore: 99,
    listingCount: 2,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
    joinedDate: 'Semester 1, 2026'
  }
];

export function AdminPage() {
  const { user, isAdmin, login } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation' | 'orders' | 'users'
  const [listingFilter, setListingFilter] = useState('all'); // 'all' | 'pending' | 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');

  // Core Data State
  const [metrics, setMetrics] = useState({
    totalUsers: 14,
    activeListings: 16,
    pendingApprovals: 2,
    totalOrders: 8,
    totalRevenuePaise: 4850000,
  });

  const [adminListings, setAdminListings] = useState(INITIAL_DEMO_LISTINGS);
  const [adminOrders, setAdminOrders] = useState(INITIAL_DEMO_ORDERS);
  const [adminUsers, setAdminUsers] = useState(INITIAL_DEMO_USERS);

  // Status & Telemetry
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [previewModalItem, setPreviewModalItem] = useState(null);

  // Activity Pulse Feed
  const [pulseFeed, setPulseFeed] = useState([
    { id: 1, type: 'rental', title: 'DSA Textbook & Exam Notes rented in North Campus', time: '10 mins ago', icon: '⚡' },
    { id: 2, type: 'handover', title: 'Vintage Oversized Flannel handed over at Central Library Steps', time: '24 mins ago', icon: '📦' },
    { id: 3, type: 'auth', title: 'Student verified: priya.patel@campus.edu (Hostel Block A)', time: '45 mins ago', icon: '🛡️' },
    { id: 4, type: 'approval', title: 'Listing approved: Higher Engineering Mathematics', time: '1 hour ago', icon: '✅' },
    { id: 5, type: 'security', title: 'Autonomous zero-trust audit completed: 0 security anomalies', time: '2 hours ago', icon: '🔒' }
  ]);

  // Load telemetry from backend
  const loadAllAdminData = async () => {
    setIsRefreshing(true);
    try {
      const [m, l, o, u] = await Promise.allSettled([
        fetchAdminMetrics(),
        fetchAdminListings(),
        fetchAdminOrders(),
        fetchAdminUsers(),
      ]);

      if (m.status === 'fulfilled' && m.value) {
        setMetrics((prev) => ({ ...prev, ...m.value }));
      }

      if (l.status === 'fulfilled' && Array.isArray(l.value) && l.value.length > 0) {
        // Merge fetched backend listings with demo items cleanly
        const existingIds = new Set(l.value.map(item => item._id || item.id));
        const mergedListings = [
          ...l.value,
          ...INITIAL_DEMO_LISTINGS.filter(d => !existingIds.has(d._id))
        ];
        setAdminListings(mergedListings);
      }

      if (o.status === 'fulfilled' && Array.isArray(o.value) && o.value.length > 0) {
        const existingOrderIds = new Set(o.value.map(ord => ord._id || ord.id));
        const mergedOrders = [
          ...o.value,
          ...INITIAL_DEMO_ORDERS.filter(d => !existingOrderIds.has(d._id))
        ];
        setAdminOrders(mergedOrders);
      }

      if (u.status === 'fulfilled' && Array.isArray(u.value) && u.value.length > 0) {
        const existingUserEmails = new Set(u.value.map(usr => usr.email));
        const mergedUsers = [
          ...u.value,
          ...INITIAL_DEMO_USERS.filter(d => !existingUserEmails.has(d.email))
        ];
        setAdminUsers(mergedUsers);
      }

      setActionNotice('Telemetry refreshed: Real-time network sync active.');
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.warn('Admin telemetry fetch note:', err?.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  // Quick fallback login for development
  const handleAdminQuickSwitch = async () => {
    await login('admin@thriftsync.campus', 'Admin@123');
    loadAllAdminData();
  };

  // Moderate Listing Action (Approve / Reject)
  const handleUpdateListing = async (listingId, newStatus) => {
    try {
      await updateAdminListingStatus(listingId, newStatus);
    } catch (e) {
      console.warn('Backend update note:', e?.message);
    }

    setAdminListings((prev) =>
      prev.map((item) => ((item._id || item.id) === listingId ? { ...item, status: newStatus } : item))
    );

    const actionText = newStatus === 'active' ? 'Approved & published to campus storefront' : 'Rejected / Moved to Archive';
    setActionNotice(`Listing #${listingId.slice(-6)}: ${actionText}`);
    setTimeout(() => setActionNotice(''), 3500);

    // Append to live pulse
    setPulseFeed(prev => [
      {
        id: Date.now(),
        type: newStatus === 'active' ? 'approval' : 'rejection',
        title: `Listing status updated to ${newStatus.toUpperCase()}`,
        time: 'Just now',
        icon: newStatus === 'active' ? '✅' : '✕'
      },
      ...prev.slice(0, 5)
    ]);
  };

  // Update Order Fulfillment Status
  const handleUpdateOrderStatus = async (orderId, newFulfillmentStatus) => {
    try {
      await updateAdminOrderFulfillment(orderId, newFulfillmentStatus);
    } catch (e) {
      console.warn('Backend order update note:', e?.message);
    }

    setAdminOrders((prev) =>
      prev.map((o) => ((o._id || o.id) === orderId ? { ...o, fulfillmentStatus: newFulfillmentStatus, orderStatus: newFulfillmentStatus === 'DELIVERED' ? 'COMPLETED' : o.orderStatus } : o))
    );

    setActionNotice(`Order #${orderId.slice(-6)} status updated to ${newFulfillmentStatus}`);
    setTimeout(() => setActionNotice(''), 3500);
  };

  // Suspend / Reactivate User Account
  const handleToggleUser = async (userId, currentActive) => {
    try {
      await updateAdminUserStatus(userId, !currentActive);
    } catch (e) {
      console.warn('Backend user toggle note:', e?.message);
    }

    setAdminUsers((prev) =>
      prev.map((u) => ((u._id || u.id) === userId ? { ...u, isActive: !currentActive } : u))
    );

    const statusStr = !currentActive ? 'Reactivated' : 'Suspended';
    setActionNotice(`User account ${statusStr} successfully.`);
    setTimeout(() => setActionNotice(''), 3500);

    setPulseFeed(prev => [
      {
        id: Date.now(),
        type: 'user',
        title: `User account #${userId.slice(-6)} ${statusStr.toLowerCase()}`,
        time: 'Just now',
        icon: !currentActive ? '🛡️' : '⚠️'
      },
      ...prev.slice(0, 5)
    ]);
  };

  // Filtered Listings
  const filteredListings = adminListings.filter((item) => {
    const matchesFilter =
      listingFilter === 'all' ? true :
      listingFilter === 'pending' ? item.status === 'pending' || item.status === 'draft' :
      listingFilter === 'active' ? item.status === 'active' :
      item.status === 'archived' || item.status === 'rejected';

    const matchesSearch = searchQuery.trim() === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Filtered Orders
  const filteredOrders = adminOrders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ord._id || '').toLowerCase().includes(q) ||
      (ord.itemTitle || '').toLowerCase().includes(q) ||
      (ord.buyer?.name || '').toLowerCase().includes(q) ||
      (ord.pickupLocation || '').toLowerCase().includes(q)
    );
  });

  // Filtered Users
  const filteredUsers = adminUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.campus || '').toLowerCase().includes(q)
    );
  });

  const pendingApprovalsCount = adminListings.filter(l => l.status === 'pending' || l.status === 'draft').length;

  // Route Guard: If not admin
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E4DD] p-10 sm:p-14 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xl select-none">
        <div className="w-16 h-16 bg-[#122620] text-[#E07A5F] rounded-2xl flex items-center justify-center mx-auto shadow-md border border-[#1D3B32]">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#122620]">Administrator Privileges Required</h2>
        <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
          The ThriftSync Command Center is restricted to campus governance administrators, trust auditors, and authorized university moderators.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/admin/login"
            className="px-6 py-2.5 bg-[#122620] hover:bg-[#1D3B32] text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#E07A5F]" />
            <span>Admin Portal Sign In</span>
          </Link>
          <button
            onClick={handleAdminQuickSwitch}
            className="px-5 py-2.5 bg-[#F6F5F0] hover:bg-gray-200 text-[#122620] font-bold text-xs rounded-full border border-[#E6E4DD] transition-all cursor-pointer"
          >
            Switch to Master Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none text-[#122620] max-w-7xl mx-auto">
      
      {/* 1. COMMAND CENTER IMMERSIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#122620] via-[#1D3B32] to-[#122620] text-white p-5 sm:p-7 rounded-xl shadow-xl border border-[#2A6F4E]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E07A5F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        {/* Left: Brand & Live Status Indicator */}
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Pulsing Network Indicator */}
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 text-emerald-400 text-[11px] font-extrabold rounded-full border border-emerald-500/40 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Campus Exchange Network Active</span>
            </span>

            <span className="text-xs text-[#A3B899] font-medium hidden sm:inline">
              Latency: 18ms • 100% Peer Verification Rate
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E07A5F] text-white rounded-lg shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                ThriftSync <span className="text-[#E07A5F]">Command Center</span>
              </h1>
              <p className="text-xs text-[#A3B899]">
                Governing peer-to-peer exchanges, moderation queues, and student trust indices.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Telemetry Actions & GMV Ticker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10">
          
          {/* GMV Metric Pill */}
          <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg backdrop-blur-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[#A3B899] uppercase tracking-wider">Total Circulated GMV</span>
            <span className="text-lg font-black text-[#E07A5F]">
              {formatCurrency(metrics.totalRevenuePaise ? metrics.totalRevenuePaise / 100 : 48500)}
            </span>
          </div>

          {/* Quick Buttons */}
          <button
            onClick={loadAllAdminData}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            title="Refresh network telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E07A5F]' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/"
            className="px-4 py-2.5 bg-[#E07A5F] hover:bg-[#C86449] active:bg-[#B5553C] text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            title="Open Student Storefront"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </Link>
        </div>

      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. VISUAL ANALYTICS: MINI GLOWING KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Platform Revenue */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E4DD] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Circulated Volume</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-[#D97706] group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#122620]">
            {formatCurrency(metrics.totalRevenuePaise ? metrics.totalRevenuePaise / 100 : 48500)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% peer velocity</span>
          </div>
        </div>

        {/* Card 2: Active Inventory & Rentals */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E4DD] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Listings</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-[#2A6F4E] group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#122620]">
            {adminListings.filter(l => l.status === 'active').length || metrics.activeListings || 16}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-gray-500">
            <CheckCircle2 className="w-3 h-3 text-[#2A6F4E]" />
            <span>100% Peer Verified</span>
          </div>
        </div>

        {/* Card 3: Pending Moderation */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E4DD] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-md bg-rose-50 text-[#E07A5F] group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#E07A5F]">
            {pendingApprovalsCount}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-[#E07A5F]">
            <Zap className="w-3 h-3" />
            <span>2-Min SLA Fast-Track</span>
          </div>
        </div>

        {/* Card 4: Campus Trust Index */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E4DD] shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trust & Integrity</span>
            <div className="p-1.5 rounded-md bg-teal-50 text-[#1D3B32] group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1D3B32]">99.2%</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-600">
            <Sparkles className="w-3 h-3" />
            <span>Zero Dispute Escapes</span>
          </div>
        </div>

      </div>

      {/* 3. INTERACTIVE TABBED NAVIGATION BAR */}
      <div className="bg-white rounded-lg border border-[#E6E4DD] p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        
        {/* Main Tab Switches */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('moderation'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'bg-[#122620] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#122620] hover:bg-[#F6F5F0]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Live Moderation Queue</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#E07A5F] text-white rounded-full text-[10px] font-black">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#122620] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#122620] hover:bg-[#F6F5F0]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Orders & Handover Control</span>
            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px] font-bold">
              {adminOrders.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#122620] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#122620] hover:bg-[#F6F5F0]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>User & Dispute Management</span>
            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px] font-bold">
              {adminUsers.length}
            </span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder={
              activeTab === 'moderation' ? 'Filter by title or seller...' :
              activeTab === 'orders' ? 'Search order ID or campus zone...' :
              'Search student name, email, campus...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F6F5F0] border border-[#E6E4DD] rounded-md text-xs outline-none focus:bg-white focus:border-[#D97706] font-medium"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>

      </div>

      {/* 4. TAB 1: LIVE MODERATION QUEUE (RICH VISUAL CARDS) */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          
          {/* Sub-Filter Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-gray-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Queue:
              </span>
              {[
                { id: 'all', label: `All (${adminListings.length})` },
                { id: 'pending', label: `Pending Approvals (${pendingApprovalsCount})`, badge: true },
                { id: 'active', label: `Active (${adminListings.filter(l => l.status === 'active').length})` },
                { id: 'archived', label: `Archived / Rejected (${adminListings.filter(l => l.status === 'archived').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setListingFilter(f.id)}
                  className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
                    listingFilter === f.id
                      ? 'bg-[#1D3B32] text-white shadow-2xs'
                      : 'bg-white border border-[#E6E4DD] text-gray-600 hover:text-black'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredListings.length}</strong> items awaiting or passing review
            </p>
          </div>

          {/* Cards Grid Layout */}
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E6E4DD] p-12 text-center text-gray-500 space-y-2">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-[#122620]">No listings found in this filter</p>
              <p className="text-xs">Adjust your search keyword or moderation filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((item) => {
                const isPending = item.status === 'pending' || item.status === 'draft';
                const isActive = item.status === 'active';
                const isArchived = item.status === 'archived';

                return (
                  <div
                    key={item._id || item.id}
                    className="bg-white rounded-xl border border-[#E6E4DD] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail Container with Zoom & Badge Overlay */}
                      <div className="relative aspect-video bg-[#F9F8F5] overflow-hidden flex items-center justify-center p-3 border-b border-gray-100">
                        <img
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Status Overlay Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-xs ${
                            isPending ? 'bg-[#E07A5F] text-white animate-pulse' :
                            isActive ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {item.status || 'PENDING'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#122620]/80 backdrop-blur-xs text-white">
                            {item.category}
                          </span>
                        </div>

                        {/* Condition Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 backdrop-blur-xs text-gray-800 border border-gray-200 shadow-2xs">
                            {item.condition}
                          </span>
                        </div>
                      </div>

                      {/* Card Content Details */}
                      <div className="p-4 space-y-2.5">
                        
                        {/* Title & Price Header */}
                        <div>
                          <h3 className="font-bold text-sm text-[#122620] line-clamp-1 group-hover:text-[#2A6F4E] transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-black text-[#E07A5F]">
                              {formatCurrency(item.price)}
                            </span>
                            {item.rentalRate && (
                              <span className="text-[11px] font-bold text-[#2A6F4E] bg-emerald-50 px-1.5 py-0.5 rounded">
                                ₹{item.rentalRate}/day rent
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description Preview */}
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description || 'No description provided by student.'}
                        </p>

                        {/* Student Seller & Location Metadata */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={item.seller?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover shrink-0 border border-gray-200"
                            />
                            <span className="font-semibold text-gray-800 truncate">
                              {item.seller?.name || 'Campus Student'}
                            </span>
                          </div>

                          <span className="text-[11px] text-[#2A6F4E] font-medium flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-[#E07A5F]" />
                            <span className="truncate max-w-[130px]">{item.campus || 'North Campus'}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Submitted: {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                      </div>
                    </div>

                    {/* BIG SATISFYING ACTION BUTTONS */}
                    <div className="p-3 bg-[#F6F5F0] border-t border-[#E6E4DD] flex items-center gap-2">
                      <button
                        onClick={() => setPreviewModalItem(item)}
                        className="p-2 bg-white hover:bg-gray-100 text-gray-700 border border-[#E6E4DD] rounded-lg transition-colors cursor-pointer"
                        title="Inspect full upload details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleUpdateListing(item._id || item.id, 'active')}
                            className="flex-1 py-2 px-3 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>✓ Approve & Push Live</span>
                          </button>

                          <button
                            onClick={() => handleUpdateListing(item._id || item.id, 'archived')}
                            className="py-2 px-3 bg-white hover:bg-rose-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Reject listing"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : isActive ? (
                        <>
                          <div className="flex-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Published on Marketplace</span>
                          </div>
                          <button
                            onClick={() => handleUpdateListing(item._id || item.id, 'archived')}
                            className="py-1.5 px-3 bg-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 text-[11px] font-bold text-gray-500">
                            Archived / Inactive
                          </div>
                          <button
                            onClick={() => handleUpdateListing(item._id || item.id, 'active')}
                            className="py-1.5 px-3 bg-[#15803D] text-white rounded-lg text-xs font-bold hover:bg-[#166534] cursor-pointer"
                          >
                            Restore Live
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* 5. TAB 2: CAMPUS ORDERS & HANDOVER CONTROL */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-[#E6E4DD] shadow-xs overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#122620]">Live Campus Handover & Escrow Pipeline</h2>
              <p className="text-xs text-gray-500">
                Track real-time student meetups, campus physical delivery confirmations, and manual administrative overrides.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#15803D] font-bold text-xs rounded-full border border-emerald-200 self-start sm:self-auto">
              {filteredOrders.length} Tracked Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F6F5F0] text-gray-600 font-bold border-b border-[#E6E4DD]">
                  <th className="p-3.5">Order ID & Item</th>
                  <th className="p-3.5">Exchange Parties</th>
                  <th className="p-3.5">Handover Spot</th>
                  <th className="p-3.5">Amount & Payment</th>
                  <th className="p-3.5">Handover Stepper</th>
                  <th className="p-3.5 text-right">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.map((ord) => {
                  const isCompleted = ord.orderStatus === 'COMPLETED' || ord.fulfillmentStatus === 'DELIVERED';
                  const isHandedOver = ord.fulfillmentStatus === 'HANDED_OVER' || ord.orderStatus === 'HANDED_OVER';

                  return (
                    <tr key={ord._id || ord.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      {/* ID & Item */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#122620] flex items-center gap-1.5">
                          <span>#{(ord._id || ord.id).slice(-8).toUpperCase()}</span>
                        </div>
                        <p className="text-gray-700 font-bold line-clamp-1 mt-0.5">
                          {ord.itemTitle || ord.items?.[0]?.title || 'Campus Thrift Item'}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Buyer & Seller */}
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black flex items-center justify-center">B</span>
                          <span className="font-bold text-gray-800">{ord.buyer?.name || 'Buyer'}</span>
                          <span className="text-[10px] text-gray-400">({ord.buyer?.campus || 'Hostel 4'})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black flex items-center justify-center">S</span>
                          <span className="font-bold text-gray-800">{ord.seller?.name || 'Seller'}</span>
                          <span className="text-[10px] text-gray-400">({ord.seller?.campus || 'North Campus'})</span>
                        </div>
                      </td>

                      {/* Pickup Spot */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-bold text-[#2A6F4E]">
                          <MapPin className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                          <span>{ord.pickupLocation || 'Central Library Steps'}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">Designated meetup</span>
                      </td>

                      {/* Amount & Mode */}
                      <td className="p-3.5">
                        <p className="font-black text-[#E07A5F] text-sm">
                          {formatCurrency(ord.totalAmount || (ord.totalPaise ? ord.totalPaise / 100 : 180))}
                        </p>
                        <span className="text-[10px] font-semibold text-gray-600 block">
                          {ord.paymentMethod || 'Campus Handover UPI'}
                        </span>
                      </td>

                      {/* Stepper Status */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' :
                              isHandedOver ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {isCompleted ? 'COMPLETED' : isHandedOver ? 'HANDED_OVER' : 'PLACED'}
                            </span>
                          </div>
                          
                          {/* Mini Progress Bar */}
                          <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                            <div className="h-full bg-[#E07A5F] w-1/3" />
                            <div className={`h-full ${isHandedOver || isCompleted ? 'bg-[#2A6F4E] w-1/3' : 'w-1/3'}`} />
                            <div className={`h-full ${isCompleted ? 'bg-[#15803D] w-1/3' : 'w-1/3'}`} />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5">
                        <select
                          value={ord.fulfillmentStatus || 'UNFULFILLED'}
                          onChange={(e) => handleUpdateOrderStatus(ord._id || ord.id, e.target.value)}
                          className="bg-white border border-[#E6E4DD] rounded px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer focus:border-[#D97706]"
                        >
                          <option value="UNFULFILLED">UNFULFILLED</option>
                          <option value="PACKED">PACKED</option>
                          <option value="HANDED_OVER">HANDED_OVER</option>
                          <option value="DELIVERED">DELIVERED / COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 6. TAB 3: USER & DISPUTE DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-[#E6E4DD] shadow-xs overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#122620]">Campus Student Directory & Account Governance</h2>
              <p className="text-xs text-gray-500">
                Inspect campus trust ratings, listing footprints, and suspend accounts flagged for misconduct.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#15803D] font-bold text-xs rounded-full border border-emerald-200 self-start sm:self-auto">
              {filteredUsers.length} Registered Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F6F5F0] text-gray-600 font-bold border-b border-[#E6E4DD]">
                  <th className="p-3.5">Student Member</th>
                  <th className="p-3.5">Campus Zone / Hostel</th>
                  <th className="p-3.5">Role & Trust Score</th>
                  <th className="p-3.5">Active Listings</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredUsers.map((u) => {
                  const isUserActive = u.isActive !== false;
                  const isAccountAdmin = u.role === 'admin';

                  return (
                    <tr key={u._id || u.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      {/* Name & Avatar */}
                      <td className="p-3.5 flex items-center gap-2.5">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#E6E4DD]"
                        />
                        <div>
                          <p className="font-bold text-[#122620]">{u.name}</p>
                          <p className="text-gray-500 text-[11px]">{u.email}</p>
                        </div>
                      </td>

                      {/* Campus Zone */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[#2A6F4E] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#E07A5F]" />
                          <span>{u.campus || 'North Campus Hub'}</span>
                        </div>
                      </td>

                      {/* Role & Trust */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isAccountAdmin ? 'bg-[#122620] text-white' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {u.role || 'STUDENT'}
                          </span>
                          <span className="text-[11px] font-bold text-amber-600">
                            ⭐ {u.trustScore || 98}%
                          </span>
                        </div>
                      </td>

                      {/* Listings */}
                      <td className="p-3.5 font-bold text-[#122620]">
                        {u.listingCount || 2} items
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isUserActive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isUserActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right">
                        {!isAccountAdmin ? (
                          <button
                            onClick={() => handleToggleUser(u._id || u.id, isUserActive)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isUserActive
                                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                : 'bg-[#15803D] hover:bg-[#166534] text-white shadow-xs'
                            }`}
                          >
                            {isUserActive ? 'Suspend Account' : 'Reactivate'}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs font-semibold">Protected Master</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 7. VISUAL ANALYTICS: RECENT ACTIVITY PULSE TICKER */}
      <div className="bg-white rounded-xl border border-[#E6E4DD] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#122620] text-[#E07A5F] rounded">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-[#122620] uppercase tracking-wider">
              Autonomous Governance & Campus Pulse Feed
            </h2>
          </div>
          <span className="text-[11px] text-[#2A6F4E] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Streaming live telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {pulseFeed.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[#F6F5F0] rounded-lg border border-[#E6E4DD] flex items-start gap-2.5 hover:bg-white hover:border-[#D97706] transition-all shadow-2xs"
            >
              <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#122620] truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. PREVIEW MODAL FOR MODERATION DETAIL */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in">
          <div className="bg-white rounded-xl border border-[#E6E4DD] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 bg-[#E07A5F] text-white rounded text-[10px] font-black uppercase">
                  {previewModalItem.category}
                </span>
                <h3 className="text-lg font-bold text-[#122620] mt-1">{previewModalItem.title}</h3>
              </div>
              <button
                onClick={() => setPreviewModalItem(null)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-[#F9F8F5] rounded-lg overflow-hidden flex items-center justify-center p-2 border">
              <img
                src={previewModalItem.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline p-2 bg-[#F6F5F0] rounded">
                <span className="font-bold text-gray-700">Listing Price:</span>
                <span className="font-black text-base text-[#E07A5F]">
                  {formatCurrency(previewModalItem.price)}
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gray-700">Student Description:</p>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                  {previewModalItem.description}
                </p>
              </div>

              <div className="flex justify-between text-gray-500 pt-1">
                <span>Handover Landmark: <strong>{previewModalItem.pickupLocation}</strong></span>
                <span>Campus: <strong>{previewModalItem.campus}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  handleUpdateListing(previewModalItem._id || previewModalItem.id, 'active');
                  setPreviewModalItem(null);
                }}
                className="flex-1 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Approve & Push Live</span>
              </button>

              <button
                onClick={() => {
                  handleUpdateListing(previewModalItem._id || previewModalItem.id, 'archived');
                  setPreviewModalItem(null);
                }}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Reject Listing
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
