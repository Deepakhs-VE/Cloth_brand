import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  MapPin,
  CreditCard,
  X,
} from 'lucide-react';
import api from '../services/api';
import { OrderStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { getProductPath } from '../utils/productPath';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setCancelling(true);
    setCancelError('');

    try {
      const res = order.isPaid
        ? await api.post(`/orders/${order._id}/refund-request`, { reason: cancelReason })
        : order.paymentMethod === 'stripe'
        ? await api.post('/payments/cancel-checkout', { orderId: order._id })
        : await api.patch(`/orders/${order._id}/cancel`, { reason: cancelReason });

      if (res.data.success) {
        setOrder(res.data.order);
        setCancelModalOpen(false);
      }
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Error cancelling order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <Link to="/account/orders" className="text-xs uppercase font-bold text-amber-700 underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  // Status timeline steps
  const steps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'In Atelier Preparation' },
    { key: 'SHIPPED', label: 'Dispatched with Courier' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const statusIndexMap = {
    PENDING: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    CANCELLED: -1,
    REFUNDED: -1,
  };

  const currentStepIndex = statusIndexMap[order.orderStatus] ?? 0;
  const activeRefundStatuses = ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUND_PENDING', 'COMPLETED'];
  const hasActiveRefundRequest = activeRefundStatuses.includes(order.refundRequest?.status);
  const isUnpaidCancellable = !order.isPaid && ['PENDING', 'CONFIRMED'].includes(order.orderStatus);
  const isPaidCancellationRequest =
    order.isPaid &&
    order.paymentStatus === 'PAID' &&
    ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus) &&
    !hasActiveRefundRequest;
  const returnWindowEndsAt = order.deliveredAt
    ? new Date(order.deliveredAt).getTime() + 30 * 24 * 60 * 60 * 1000
    : 0;
  const isReturnRequest =
    order.isPaid &&
    order.paymentStatus === 'PAID' &&
    order.orderStatus === 'DELIVERED' &&
    Date.now() <= returnWindowEndsAt &&
    !hasActiveRefundRequest;
  const canOpenRequest = isUnpaidCancellable || isPaidCancellationRequest || isReturnRequest;
  const requestButtonLabel = isReturnRequest
    ? 'Request Return & Refund'
    : isPaidCancellationRequest
    ? 'Request Cancellation & Refund'
    : 'Cancel Order';

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="space-y-1">
            <Link
              to="/account/orders"
              className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-900 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all orders</span>
            </Link>
            <div className="flex items-center space-x-3">
              <h1 className="font-luxury text-2xl sm:text-3xl font-extrabold text-slate-900">
                Order #{order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-400">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Cancellation / return action when eligible */}
          {canOpenRequest && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase tracking-wider transition self-start sm:self-auto"
            >
              {requestButtonLabel}
            </button>
          )}
        </div>

        {order.refundRequest && (
          <div className={`p-5 rounded-2xl border ${
            order.refundRequest.status === 'REJECTED'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : order.refundRequest.status === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider">
                {order.refundRequest.type === 'RETURN' ? 'Return' : 'Cancellation'} request
              </p>
              <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white/70 rounded-lg">
                {order.refundRequest.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs mt-2">Reason: {order.refundRequest.reason}</p>
            {order.refundRequest.adminNote && (
              <p className="text-xs mt-1">Store response: {order.refundRequest.adminNote}</p>
            )}
            {order.refundRequest.type === 'RETURN' && order.refundRequest.status === 'APPROVED' && (
              <p className="text-xs mt-2 font-semibold">
                Your return is approved. Send the complete order back using the instructions provided by support. The refund is issued after the parcel is received and inspected.
              </p>
            )}
          </div>
        )}

        {/* Status Timeline */}
        {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REFUNDED' ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="font-luxury text-base font-bold text-slate-900">
              Shipment Progress
            </h2>

            <div className="relative">
              <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-0" />
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                {steps.map((step, idx) => {
                  const isPassed = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm ${
                          isPassed
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        } ${isCurrent ? 'ring-4 ring-amber-400/30' : ''}`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-semibold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.trackingNumber && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Carrier:</span>{' '}
                  <span className="font-bold text-slate-900">{order.carrier || 'Global Express'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tracking Ref:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">{order.trackingNumber}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-rose-800 space-y-2">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm">
                Order Status: {order.orderStatus}
              </h3>
            </div>
            {order.cancellationReason && (
              <p className="text-xs text-rose-700">Reason: {order.cancellationReason}</p>
            )}
          </div>
        )}

        {/* Order Items Table */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-luxury text-base font-bold text-slate-900">
            Acquisition Details
          </h2>

          <div className="divide-y divide-slate-100">
            {order.orderItems.map((item, idx) => {
              const productPath = getProductPath(item);
              return (
              <div key={idx} className="group/item py-4 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center space-x-4">
                  {productPath ? (
                    <Link
                      to={productPath}
                      className="block shrink-0 overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                      aria-label={`View ${item.name}`}
                    >
                      <img
                        src={item.image || '/image-placeholder.svg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover border border-slate-100 transition-transform duration-300 group-hover/item:scale-105"
                      />
                    </Link>
                  ) : (
                    <img
                      src={item.image || '/image-placeholder.svg'}
                      alt={item.name}
                      className="w-16 h-16 shrink-0 object-cover rounded-xl border border-slate-100"
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {productPath ? (
                        <Link to={productPath} className="transition hover:text-amber-700 focus:outline-none focus:underline">
                          {item.name}
                        </Link>
                      ) : item.name}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Size: {item.selectedSize || 'M'}
                      </span>
                      {item.selectedColor && <span>• {item.selectedColor}</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-900">
                  ${item.total.toFixed(2)}
                </span>
              </div>
              );
            })}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({order.couponCode})</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Courier Delivery</span>
              <span className="font-semibold text-slate-900">${order.shippingAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="font-semibold text-slate-900">${order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold text-sm text-slate-900">
              <span>Total Paid</span>
              <span className="font-luxury text-lg text-slate-900">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Delivery Recipient</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.streetAddress}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="text-slate-400 pt-1">Tel: {order.shippingAddress.phone}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Payment & Settlement</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Method:{' '}
                <span className="font-bold uppercase text-slate-900">
                  {order.paymentMethod.replace(/_/g, ' ')}
                </span>
              </p>
              <p>
                Status:{' '}
                <span className="font-bold text-emerald-600 uppercase">
                  {order.paymentStatus}
                </span>
              </p>
              {order.paymentResult?.transactionId && (
                <p className="font-mono text-[11px] text-slate-400">
                  Tx: {order.paymentResult.transactionId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={isReturnRequest ? 'Request a Return & Refund' : order?.isPaid ? 'Request Cancellation & Refund' : 'Cancel This Order'}
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-xs text-slate-600">
            {isReturnRequest
              ? 'Returns are reviewed by the store. After approval, send the complete order back; Stripe refunds the original payment after the parcel is received and inspected.'
              : order?.isPaid
              ? 'The store must approve this request before your original Stripe payment is refunded. Orders already in transit cannot be cancelled.'
              : 'Cancelling will close the unpaid Stripe session and restore the reserved inventory.'}
          </p>

          {cancelError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {cancelError}
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              {isReturnRequest ? 'Reason for Return' : 'Reason for Cancellation'}
            </label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              minLength={10}
              placeholder={isReturnRequest ? 'Explain why you are returning this order' : 'e.g. Changed preference or incorrect delivery address'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={cancelling}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition disabled:opacity-50"
          >
            {cancelling
              ? 'Submitting...'
              : order?.isPaid
              ? 'Submit Request'
              : 'Confirm Cancellation'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
