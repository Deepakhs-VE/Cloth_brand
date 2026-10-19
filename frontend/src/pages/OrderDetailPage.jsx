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
  FileDown,
} from 'lucide-react';
import api from '../services/api';
import { OrderStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { getProductPath } from '../utils/productPath';
import { useCurrency } from '../hooks/useCurrency';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const { formatMoney } = useCurrency();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [exchangeVariants, setExchangeVariants] = useState([]);
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeError, setExchangeError] = useState('');
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [itemReturnModalOpen, setItemReturnModalOpen] = useState(false);
  const [itemReturnItem, setItemReturnItem] = useState(null);
  const [itemReturnQuantity, setItemReturnQuantity] = useState(1);
  const [itemReturnReason, setItemReturnReason] = useState('');
  const [itemReturnError, setItemReturnError] = useState('');
  const [itemReturnSubmitting, setItemReturnSubmitting] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);

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

  const openExchange = async (item) => {
    setExchangeError('');
    setExchangeItem(item);
    setExchangeReason('');
    try {
      const response = await api.get(`/products/${item.slug || item.product}`);
      const variants = (response.data.product?.variants || []).filter(
        (variant) => variant.isActive !== false && variant.stock >= item.quantity && variant.sku !== item.variantSku
      );
      setExchangeVariants(variants);
      setExchangeColor(variants[0]?.color || '');
      setExchangeSize(variants[0]?.size || '');
      setExchangeModalOpen(true);
    } catch (error) {
      setExchangeError(error.response?.data?.message || 'Replacement options could not be loaded');
      setExchangeModalOpen(true);
    }
  };

  const submitExchange = async (event) => {
    event.preventDefault();
    setExchangeSubmitting(true);
    setExchangeError('');
    try {
      const response = await api.post(`/orders/${order._id}/exchanges`, {
        orderItemId: exchangeItem._id,
        toSize: exchangeSize,
        toColor: exchangeColor,
        reason: exchangeReason,
      });
      setOrder(response.data.order);
      setExchangeModalOpen(false);
    } catch (error) {
      setExchangeError(error.response?.data?.message || 'Exchange request could not be submitted');
    } finally {
      setExchangeSubmitting(false);
    }
  };

  const remainingRequestQuantity = (item) => {
    const pending = (order?.itemReturnRequests || [])
      .filter((request) => String(request.orderItemId) === String(item._id) && !['REJECTED', 'COMPLETED'].includes(request.status))
      .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
    return Math.max(0, Number(item.quantity || 0) - Number(item.cancelledQuantity || 0) - Number(item.returnedQuantity || 0) - pending);
  };

  const isItemReturnEligible = (item) => {
    if (!order?.isPaid || order.paymentStatus !== 'PAID' || remainingRequestQuantity(item) < 1) return false;
    if (['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus)) return true;
    if (order.orderStatus !== 'DELIVERED' || item.returnPolicy?.finalSale || item.returnPolicy?.returnable === false) return false;
    const days = item.returnPolicy?.returnWindowDays ?? 30;
    const deliveredAt = order.deliveredAt || order.updatedAt;
    return Date.now() <= new Date(deliveredAt).getTime() + days * 86400000;
  };

  const openItemReturn = (item) => {
    setItemReturnItem(item);
    setItemReturnQuantity(1);
    setItemReturnReason('');
    setItemReturnError('');
    setItemReturnModalOpen(true);
  };

  const submitItemReturn = async (event) => {
    event.preventDefault();
    setItemReturnSubmitting(true);
    setItemReturnError('');
    try {
      const response = await api.post(`/orders/${order._id}/item-returns`, {
        orderItemId: itemReturnItem._id,
        quantity: Number(itemReturnQuantity),
        reason: itemReturnReason,
      });
      setOrder(response.data.order);
      setItemReturnModalOpen(false);
    } catch (error) {
      setItemReturnError(error.response?.data?.message || 'Your request could not be submitted');
    } finally {
      setItemReturnSubmitting(false);
    }
  };

  const downloadInvoice = async () => {
    setInvoiceDownloading(true);
    try {
      const response = await api.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Invoice download failed:', error);
    } finally {
      setInvoiceDownloading(false);
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
  const canOpenRequest = isUnpaidCancellable || isPaidCancellationRequest;
  const requestButtonLabel = isPaidCancellationRequest
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
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            {order.isPaid && (
              <button
                type="button"
                onClick={downloadInvoice}
                disabled={invoiceDownloading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                <FileDown className="h-4 w-4" /> {invoiceDownloading ? 'Preparing...' : 'VAT Invoice'}
              </button>
            )}
            {canOpenRequest && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                {requestButtonLabel}
              </button>
            )}
          </div>
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
            Order Summary
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
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-600">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Size: {item.selectedSize || 'Not specified'}
                      </span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Colour: {item.selectedColor || 'Not specified'}
                      </span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Quantity: {item.quantity}
                      </span>
                      {item.variantSku && (
                        <span className="font-mono text-slate-500 px-1.5 py-0.5">SKU: {item.variantSku}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Unit price: {formatMoney(item.price || 0, order.currency)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
                    {isItemReturnEligible(item) && (
                      <button
                        type="button"
                        onClick={() => openItemReturn(item)}
                        className="text-[10px] font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900 underline underline-offset-2"
                      >
                        {order.orderStatus === 'DELIVERED' ? 'Return this item' : 'Cancel this item'}
                      </button>
                    )}
                    {order.isPaid && order.orderStatus === 'DELIVERED'
                      && item.returnPolicy?.exchangeable !== false
                      && Date.now() <= new Date(order.deliveredAt || order.updatedAt).getTime() + (item.returnPolicy?.exchangeWindowDays ?? 30) * 86400000
                      && item.variantSku && !order.exchangeRequests?.some(
                      (request) => request.orderItemId === item._id && !['REJECTED', 'COMPLETED'].includes(request.status)
                    ) && (
                      <button
                        type="button"
                        onClick={() => openExchange(item)}
                        className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:text-amber-900 underline underline-offset-2"
                      >
                        Exchange size or colour
                      </button>
                    )}
                    </div>
                    {item.returnPolicy?.finalSale ? (
                      <p className="mt-2 text-[10px] font-semibold text-rose-600">Final sale — returns unavailable</p>
                    ) : (
                      <p className="mt-2 text-[10px] text-slate-400">
                        {item.returnPolicy?.returnWindowDays ?? 30}-day returns · {item.returnPolicy?.exchangeWindowDays ?? 30}-day exchanges
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-900">
                  {formatMoney(item.total ?? item.price * item.quantity, order.currency)}
                </span>
              </div>
              );
            })}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatMoney(order.subtotal || 0, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({order.couponCode})</span>
                <span>-{formatMoney(order.discountAmount || 0, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Courier Delivery</span>
              <span className="font-semibold text-slate-900">{formatMoney(order.shippingAmount || 0, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>{order.pricesIncludeVat ? 'VAT included' : 'VAT'}</span>
              <span className="font-semibold text-slate-900">{formatMoney(order.taxAmount || 0, order.currency)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold text-sm text-slate-900">
              <span>Total Paid</span>
              <span className="font-luxury text-lg text-slate-900">{formatMoney(order.totalAmount || 0, order.currency)}</span>
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
              <a className="inline-block text-slate-500 pt-1 hover:text-slate-900" href={`tel:${order.shippingAddress.phone}`}>
                Tel: {order.shippingAddress.phone}
              </a>
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
                  {(order.paymentMethod || 'Not available').replace(/_/g, ' ')}
                </span>
              </p>
              <p>
                Status:{' '}
                <span className={`font-bold uppercase ${
                  order.paymentStatus === 'PAID'
                    ? 'text-emerald-600'
                    : order.paymentStatus === 'REFUNDED'
                    ? 'text-violet-600'
                    : 'text-amber-600'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </span>
              </p>
              {(order.paidAt || order.paymentResult?.updateTime) && (
                <p>
                  Paid on:{' '}
                  <span className="font-semibold text-slate-900">
                    {new Date(order.paidAt || order.paymentResult.updateTime).toLocaleString()}
                  </span>
                </p>
              )}
              {order.paymentResult?.emailAddress && (
                <p>
                  Receipt email: <span className="font-semibold text-slate-900">{order.paymentResult.emailAddress}</span>
                </p>
              )}
              {(order.paymentResult?.transactionId || order.paymentResult?.id) && (
                <p className="font-mono text-[11px] text-slate-400 break-all pt-1">
                  Transaction: {order.paymentResult.transactionId || order.paymentResult.id}
                </p>
              )}
            </div>
          </div>
        </div>

        {order.exchangeRequests?.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="font-luxury text-base font-bold text-slate-900">Exchange Requests</h2>
            {order.exchangeRequests.map((request) => (
              <div key={request._id} className="rounded-2xl border border-slate-200 p-4 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-slate-900">{request.productName}</p>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">{request.status}</span>
                </div>
                <p className="mt-2 text-slate-600">
                  {request.fromColor || 'Default'} / {request.fromSize || 'One size'} → {request.toColor || 'Default'} / {request.toSize || 'One size'}
                </p>
                <p className="mt-1 text-slate-500">Reason: {request.reason}</p>
                {request.adminNote && <p className="mt-1 text-slate-500">Store update: {request.adminNote}</p>}
              </div>
            ))}
          </div>
        )}

        {order.itemReturnRequests?.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="font-luxury text-base font-bold text-slate-900">Item Returns & Cancellations</h2>
            {order.itemReturnRequests.map((request) => (
              <div key={request._id} className="rounded-2xl border border-slate-200 p-4 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-slate-900">{request.productName} · Qty {request.quantity}</p>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-800">
                    {request.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-2 text-slate-600">{request.type === 'RETURN' ? 'Return' : 'Cancellation'} · Expected refund {formatMoney(request.refundAmount || 0, order.currency)}</p>
                <p className="mt-1 text-slate-500">Reason: {request.reason}</p>
                {request.adminNote && <p className="mt-1 text-slate-500">Store update: {request.adminNote}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={order?.isPaid ? 'Request Cancellation & Refund' : 'Cancel This Order'}
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-xs text-slate-600">
            {order?.isPaid
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
              Reason for Cancellation
            </label>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              minLength={10}
              placeholder="e.g. Changed preference or incorrect delivery address"
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

      <Modal
        isOpen={itemReturnModalOpen}
        onClose={() => setItemReturnModalOpen(false)}
        title={order?.orderStatus === 'DELIVERED' ? 'Return Item' : 'Cancel Item'}
      >
        <form onSubmit={submitItemReturn} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-bold text-slate-900">{itemReturnItem?.name}</p>
            <p className="mt-1">{itemReturnItem?.selectedColor || 'Default colour'} · {itemReturnItem?.selectedSize || 'One size'}</p>
          </div>
          {itemReturnError && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{itemReturnError}</p>}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-700">Quantity</label>
            <select
              value={itemReturnQuantity}
              onChange={(event) => setItemReturnQuantity(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs"
            >
              {Array.from({ length: itemReturnItem ? remainingRequestQuantity(itemReturnItem) : 0 }, (_, index) => index + 1).map((quantity) => (
                <option key={quantity} value={quantity}>{quantity}</option>
              ))}
            </select>
          </div>
          <textarea
            required
            minLength={10}
            rows={3}
            value={itemReturnReason}
            onChange={(event) => setItemReturnReason(event.target.value)}
            placeholder="Tell us why you need this return or cancellation"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
          />
          <button
            type="submit"
            disabled={itemReturnSubmitting}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {itemReturnSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={exchangeModalOpen}
        onClose={() => setExchangeModalOpen(false)}
        title="Exchange Size or Colour"
      >
        <form onSubmit={submitExchange} className="space-y-4">
          <p className="text-xs text-slate-600">
            Choose an in-stock replacement for {exchangeItem?.name}. Direct exchanges are available only when the replacement has the same price.
          </p>
          {exchangeError && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{exchangeError}</p>}
          {exchangeVariants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exchangeVariants.map((variant) => (
                <button
                  key={variant.sku}
                  type="button"
                  onClick={() => { setExchangeSize(variant.size); setExchangeColor(variant.color); }}
                  className={`rounded-xl border p-3 text-left text-xs ${
                    exchangeSize === variant.size && exchangeColor === variant.color
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span className="block font-bold">{variant.color || 'Default colour'} / {variant.size || 'One size'}</span>
                  <span className="mt-1 block text-[10px] opacity-70">{variant.stock} available · {variant.sku}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No replacement variants are currently available.</p>
          )}
          <textarea
            required
            minLength={5}
            rows={3}
            value={exchangeReason}
            onChange={(event) => setExchangeReason(event.target.value)}
            placeholder="Why do you need an exchange?"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
          />
          <button
            type="submit"
            disabled={exchangeSubmitting || !exchangeVariants.length}
            className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {exchangeSubmitting ? 'Submitting...' : 'Submit Exchange Request'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
