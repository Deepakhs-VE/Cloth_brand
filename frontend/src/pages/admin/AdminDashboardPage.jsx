import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { OrderStatusBadge } from '../../components/common/Badge';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard-stats');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Executive Overview">
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
  };

  return (
    <AdminLayout title="Executive Performance Dashboard">
      <div className="space-y-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Gross Revenue
              </p>
              <h3 className="font-luxury text-2xl font-black text-slate-900 mt-1">
                ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Verified settlements
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Total Orders
              </p>
              <h3 className="font-luxury text-2xl font-black text-slate-900 mt-1">
                {stats.totalOrders}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats.pendingOrders} awaiting fulfillment
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Active Patrons
              </p>
              <h3 className="font-luxury text-2xl font-black text-slate-900 mt-1">
                {stats.totalUsers}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Registered clients</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Catalog Items
              </p>
              <h3 className="font-luxury text-2xl font-black text-slate-900 mt-1">
                {stats.totalProducts}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Active inventory masterworks</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Section */}
        {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Inventory Depletion Warnings (&lt;= 5 Units)</span>
              </div>
              <Link to="/admin/products" className="text-xs text-orange-700 font-bold hover:underline">
                Manage Stock
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.lowStockProducts.map((p) => (
                <div key={p._id} className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{p.name}</p>
                    <p className="text-[10px] text-slate-500">SKU: {p.sku}</p>
                  </div>
                  <span className="text-xs font-black text-orange-700 px-2 py-0.5 bg-orange-100 rounded">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders & Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-luxury text-base font-bold text-slate-900">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="text-xs text-amber-700 font-bold uppercase tracking-wider hover:underline flex items-center space-x-1"
              >
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Order Number</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          <Link to={`/admin/orders`} className="hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 text-slate-700 font-medium">
                          {o.shippingAddress?.fullName || o.user?.name || 'Customer'}
                        </td>
                        <td className="py-3.5">
                          <OrderStatusBadge status={o.orderStatus} />
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-900">
                          ${o.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No orders yet.</p>
            )}
          </div>

          {/* Recent Users List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-luxury text-base font-bold text-slate-900">
                Recent Patrons
              </h2>
              <Link
                to="/admin/users"
                className="text-xs text-amber-700 font-bold uppercase tracking-wider hover:underline flex items-center space-x-1"
              >
                <span>All Users</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data?.recentUsers && data.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {data.recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No users registered yet.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
