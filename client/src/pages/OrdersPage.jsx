import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Star, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  Repeat
} from 'lucide-react';
import { fetchMyOrders, cancelOrder, confirmHandover } from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const loadOrders = async () => {
    setIsLoading(true);
    let remoteOrders = [];
    try {
      remoteOrders = await fetchMyOrders();
    } catch (err) {
      console.warn('Remote orders fetch note:', err?.message);
    }

    // Retrieve locally saved orders from localStorage as well
    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('thriftsync_orders') || '[]');
    } catch {}

    // Combine and deduplicate
    const combined = [...localOrders, ...remoteOrders];
    const seen = new Set();
    const deduped = combined.filter((ord) => {
      const id = ord._id || ord.orderId;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    setOrders(deduped);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this campus handover request?')) return;

    try {
      await cancelOrder(orderId, 'Buyer cancelled meetup');
    } catch (err) {
      console.warn('Cancel order API fallback:', err?.message);
    }

    // Update in local state
    setOrders((prev) =>
      prev.map((o) =>
        (o._id === orderId || o.orderId === orderId)
          ? { ...o, orderStatus: 'CANCELLED', status: 'CANCELLED' }
          : o
      )
    );

    // Update localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('thriftsync_orders') || '[]');
      const updated = stored.map((o) =>
        (o._id === orderId || o.orderId === orderId)
          ? { ...o, orderStatus: 'CANCELLED', status: 'CANCELLED' }
          : o
      );
      localStorage.setItem('thriftsync_orders', JSON.stringify(updated));
    } catch {}

    setActionSuccessMessage('Order cancelled successfully.');
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleConfirmHandover = async (orderId) => {
    try {
      await confirmHandover(orderId, 'Buyer confirmed receipt');
    } catch (err) {
      console.warn('Handover confirm API fallback:', err?.message);
    }

    setOrders((prev) =>
      prev.map((o) =>
        (o._id === orderId || o.orderId === orderId)
          ? { ...o, orderStatus: 'COMPLETED', status: 'COMPLETED', handover: { ...o.handover, buyerConfirmed: true } }
          : o
      )
    );

    setActionSuccessMessage('Handover verified! Thank you for participating in sustainable campus exchange.');
    setTimeout(() => setActionSuccessMessage(''), 4000);
  };

  const filteredOrders = orders.filter((o) => {
    const st = (o.orderStatus || o.status || 'CONFIRMED').toUpperCase();
    if (activeFilter === 'active') return st === 'PENDING' || st === 'CONFIRMED' || st === 'PACKED';
    if (activeFilter === 'completed') return st === 'COMPLETED';
    if (activeFilter === 'cancelled') return st === 'CANCELLED';
    return true;
  });

  return (
    <div className="space-y-6 pb-16 select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E4DD]">
        <div>
          <h1 className="text-2xl font-black text-[#122620]">Your Campus Orders & Handover Status</h1>
          <p className="text-xs text-[#5C635E]">
            Track peer meetup dates, rental returns, and confirm received campus items.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                activeFilter === tab
                  ? 'bg-[#1D3B32] text-white'
                  : 'bg-white border border-[#E6E4DD] text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab} ({
                orders.filter((o) => {
                  const st = (o.orderStatus || o.status || 'CONFIRMED').toUpperCase();
                  if (tab === 'active') return st === 'PENDING' || st === 'CONFIRMED' || st === 'PACKED';
                  if (tab === 'completed') return st === 'COMPLETED';
                  if (tab === 'cancelled') return st === 'CANCELLED';
                  return true;
                }).length
              })
            </button>
          ))}
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2A6F4E]" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500">
          Loading your campus orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-md border border-[#E6E4DD] p-12 text-center space-y-4 shadow-xs">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#122620]">No orders found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You don't have any {activeFilter !== 'all' ? activeFilter : ''} orders yet. Browse our campus exchange for textbooks, jackets, or dorm tech.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-block px-5 py-2 bg-[#E07A5F] hover:bg-[#C86449] text-white font-bold text-xs rounded-full cursor-pointer shadow-xs"
          >
            Explore Campus Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderId = order.orderId || (order._id ? order._id.toString() : 'ORD-101');
            const status = (order.orderStatus || order.status || 'CONFIRMED').toUpperCase();
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : 'Recent';

            const isPendingOrConfirmed = status === 'PENDING' || status === 'CONFIRMED' || status === 'PACKED';
            const isCompleted = status === 'COMPLETED';
            const isCancelled = status === 'CANCELLED';

            return (
              <div key={orderId} className="bg-white rounded-md border border-[#E6E4DD] shadow-xs overflow-hidden text-xs">
                
                {/* Order Top Meta Strip (Amazon Style) */}
                <div className="bg-[#F6F5F0] px-4 py-3 border-b border-[#E6E4DD] flex flex-wrap items-center justify-between gap-3 text-[#5C635E]">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold block text-gray-400">Order Placed</span>
                      <span className="font-semibold text-[#122620]">{dateStr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block text-gray-400">Total</span>
                      <span className="font-bold text-[#E07A5F]">
                        {formatCurrency(order.totalAmount || (order.totalPaise ? order.totalPaise / 100 : 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block text-gray-400">Handover Spot</span>
                      <span className="font-semibold text-[#122620] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E07A5F]" />
                        {order.pickupLocation || 'Student Center Desk'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold block text-gray-400">Order #</span>
                    <span className="font-mono font-bold text-[#122620]">{orderId}</span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] font-bold rounded-full text-xs flex items-center gap-1.5 border border-[#BBF7D0]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Handover Completed & Verified
                        </span>
                      )}
                      {isPendingOrConfirmed && (
                        <span className="px-3 py-1 bg-[#FEF3C7] text-[#D97706] font-bold rounded-full text-xs flex items-center gap-1.5 border border-[#FDE68A]">
                          <Clock className="w-3.5 h-3.5" /> Handover Scheduled • Meetup Pending
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs flex items-center gap-1.5 border border-red-200">
                          <XCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      )}
                    </div>

                    {/* Order Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isPendingOrConfirmed && (
                        <>
                          <button
                            onClick={() => handleConfirmHandover(order._id || orderId)}
                            className="px-4 py-1.5 bg-[#1D3B32] hover:bg-[#122620] text-white font-bold rounded-full cursor-pointer shadow-2xs"
                          >
                            Confirm Item Received
                          </button>
                          <button
                            onClick={() => handleCancel(order._id || orderId)}
                            className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-full cursor-pointer"
                          >
                            Cancel Meetup
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Items in this order */}
                  <div className="divide-y divide-gray-100">
                    {(order.items || []).map((it, idx) => {
                      const itemTitle = it.title || it.product?.title || 'Campus Item';
                      const itemImage = it.image || it.product?.images?.[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80';
                      const itemPrice = it.unitPricePaise ? it.unitPricePaise / 100 : (it.product?.price || 0);

                      return (
                        <div key={idx} className="py-3 flex gap-4 items-center">
                          <img
                            src={itemImage}
                            alt={itemTitle}
                            className="w-16 h-16 object-contain bg-[#F9F8F5] border border-gray-200 rounded p-1"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-[#122620] text-sm truncate">{itemTitle}</h4>
                            <p className="text-gray-500 text-xs">
                              Quantity: <span className="font-semibold">{it.quantity || 1}</span> • Total: <strong className="text-[#E07A5F]">{formatCurrency(itemPrice * (it.quantity || 1))}</strong>
                            </p>
                            {order.meetupNotes && (
                              <p className="text-[11px] text-gray-600 italic">Notes: "{order.meetupNotes}"</p>
                            )}
                          </div>
                          <div>
                            <Link
                              to="/products"
                              className="px-3 py-1.5 border border-[#E6E4DD] rounded-full font-semibold hover:bg-gray-50 text-gray-800"
                            >
                              Buy Again
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
