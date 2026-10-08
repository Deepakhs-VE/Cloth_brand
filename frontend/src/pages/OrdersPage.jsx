import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Eye, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { OrderStatusBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { getProductPath } from '../utils/productPath';
import { Pagination } from '../components/common/Pagination';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get(`/orders/my-orders?page=${page}&limit=6`);
        if (res.data.success) {
          setOrders(res.data.orders);
          setTotalPages(res.data.pages || 1);
          setTotalOrders(res.data.total || 0);
          if (res.data.page && res.data.page !== page) setPage(res.data.page);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="font-luxury text-3xl font-extrabold text-slate-900">
            Order History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your {totalOrders > 0 ? `${totalOrders} ` : ''}historical acquisitions, delivery timelines, and shipment tracking
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-200 transition"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.orderStatus} />
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Order items thumbnails */}
                  <div className="flex items-center space-x-3 overflow-x-auto py-1">
                    {order.orderItems.map((item, idx) => {
                      const productPath = getProductPath(item);
                      return (
                      <div key={idx} className="group/item flex items-center space-x-2 flex-shrink-0">
                        {productPath ? (
                          <Link
                            to={productPath}
                            className="block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                            aria-label={`View ${item.name}`}
                          >
                            <img
                              src={item.image || '/image-placeholder.svg'}
                              alt={item.name}
                              className="w-12 h-12 object-cover border border-slate-100 transition-transform duration-300 group-hover/item:scale-105"
                            />
                          </Link>
                        ) : (
                          <img
                            src={item.image || '/image-placeholder.svg'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                          />
                        )}
                        <div className="text-xs">
                          {productPath ? (
                            <Link
                              to={productPath}
                              className="block font-medium text-slate-800 line-clamp-1 max-w-[150px] transition hover:text-amber-700 focus:outline-none focus:underline"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <p className="font-medium text-slate-800 line-clamp-1 max-w-[150px]">
                              {item.name}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Charged</p>
                    <p className="font-luxury text-lg font-extrabold text-slate-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <Link
                    to={`/account/orders/${order._id}`}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>View Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You have not placed any orders yet. Discover our curated masterworks."
            actionText="Start Shopping"
            actionLink="/products"
          />
        )}
      </div>
    </div>
  );
};
