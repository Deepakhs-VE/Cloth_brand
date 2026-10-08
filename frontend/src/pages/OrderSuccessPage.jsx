import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export const OrderSuccessPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { fetchCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const confirmAndLoadOrder = async () => {
      try {
        if (!sessionId) {
          throw new Error('Stripe confirmation reference is missing');
        }

        const confirmation = await api.get(`/payments/confirm/${encodeURIComponent(sessionId)}`);
        if (!confirmation.data.success || confirmation.data.order?._id !== id) {
          throw new Error('Stripe payment could not be matched to this order');
        }

        setOrder(confirmation.data.order);
        await fetchCart();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to verify this Stripe payment');
      } finally {
        setLoading(false);
      }
    };

    confirmAndLoadOrder();
  }, [id, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="font-luxury text-2xl font-bold text-slate-900">Payment Verification Pending</h1>
          <p className="text-sm text-slate-600 mt-3">{error}</p>
          <Link to="/account/orders" className="inline-flex mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider font-bold">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 stroke-[2]" />
          </div>

          <div>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-1">
              Order Confirmed & Verified
            </p>
            <h1 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900">
              Thank You for Your Order
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              Order Reference:{' '}
              <span className="font-mono font-bold text-slate-900">
                {order?.orderNumber || 'AUR-ORDER'}
              </span>
            </p>
          </div>

          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your selection has been assigned to our concierge for inspection and preparation. A confirmation notice has been sent to your registered email.
          </p>

          {/* Order Snapshot */}
          {order && (
            <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Delivery Recipient</span>
                <span className="text-xs text-slate-600 font-medium">{order.shippingAddress?.fullName}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Shipping Address</span>
                <span className="text-xs text-slate-600 font-medium text-right">
                  {order.shippingAddress?.streetAddress}, {order.shippingAddress?.city}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Payment Status</span>
                <span className="text-xs font-bold text-emerald-600 uppercase">
                  {order.paymentStatus || 'PAID'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-slate-900">Total Charged</span>
                <span className="font-luxury text-lg font-extrabold text-slate-900">
                  ${order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/account/orders/${order?._id || ''}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-md flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Track Order Progress</span>
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto px-6 py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs uppercase tracking-widest font-bold rounded-xl transition"
            >
              Continue Exploring
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
