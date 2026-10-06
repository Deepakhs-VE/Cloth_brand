import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Heart,
  User,
  ArrowRight,
  LogOut,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { OrderStatusBadge } from '../components/common/Badge';

export const AccountDashboardPage = () => {
  const { user, logout, isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const [ordersRes, addrRes] = await Promise.all([
          api.get('/orders/my-orders'),
          api.get('/users/addresses'),
        ]);

        if (ordersRes.data.success) setOrders(ordersRes.data.orders);
        if (addrRes.data.success) setAddressCount(addrRes.data.count);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* User Welcome Banner */}
        <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-luxury font-black text-2xl flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-luxury text-2xl sm:text-3xl font-extrabold text-white">
                  {user?.name}
                </h1>
                {isAdmin && (
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/account/orders"
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center space-x-4"
          >
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{orders.length}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                My Orders
              </p>
            </div>
          </Link>

          <Link
            to="/account/addresses"
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center space-x-4"
          >
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{addressCount}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Saved Addresses
              </p>
            </div>
          </Link>

          <Link
            to="/account/wishlist"
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center space-x-4"
          >
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{wishlist.length}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Wishlist Pieces
              </p>
            </div>
          </Link>

          <Link
            to="/account/profile"
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center space-x-4"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">Profile</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Account Details
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-luxury text-xl font-bold text-slate-900">Recent Orders</h2>
            <Link
              to="/account/orders"
              className="text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Order Ref</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-4 text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <OrderStatusBadge status={o.orderStatus} />
                      </td>
                      <td className="py-4 text-slate-600">
                        {o.orderItems.length} {o.orderItems.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-4 font-bold text-slate-900 text-right">
                        ${o.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          to={`/account/orders/${o._id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-[11px] font-bold uppercase transition"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm">No orders recorded yet.</p>
              <Link to="/products" className="text-xs font-bold text-amber-700 underline mt-2 inline-block">
                Start shopping now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
