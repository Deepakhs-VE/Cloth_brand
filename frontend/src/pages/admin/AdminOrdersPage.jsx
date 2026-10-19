import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Truck,
  Edit2,
  Calendar,
  RotateCcw,
  MapPin,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { SelectDropdown } from '../../components/common/SelectDropdown';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';
import { useCurrency } from '../../hooks/useCurrency';

export const AdminOrdersPage = () => {
  const { showAlert, showConfirm } = useApplicationAlert();
  const { formatMoney } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [refundingOrderId, setRefundingOrderId] = useState('');
  const [refundRequestOrder, setRefundRequestOrder] = useState(null);
  const [refundRequestModalOpen, setRefundRequestModalOpen] = useState(false);
  const [refundAdminNote, setRefundAdminNote] = useState('');
  const [reviewingRefund, setReviewingRefund] = useState(false);
  const [itemRequestNotes, setItemRequestNotes] = useState({});
  const [processingItemRequest, setProcessingItemRequest] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/orders/admin/all?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search, page]);

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setCarrier(order.carrier || 'Global Express Courier');
    setTrackingNumber(order.trackingNumber || '');
    setStatusNote('');
    setModalOpen(true);
  };

  const handleOpenDetails = (order) => {
    setDetailOrder(order);
    setDetailModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const res = await api.patch(`/orders/admin/${selectedOrder._id}/status`, {
        status: newStatus,
        carrier,
        trackingNumber,
        note: statusNote,
      });

      if (res.data.success) {
        await loadOrders();
        setModalOpen(false);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async (order) => {
    const confirmed = await showConfirm(
      `A full refund of ${formatMoney(order.totalAmount, order.currency)} will be issued through Stripe for order ${order.orderNumber}. This action cannot be reversed.`,
      {
        title: 'Confirm Stripe Refund',
        confirmLabel: `Refund ${formatMoney(order.totalAmount, order.currency)}`,
      }
    );
    if (!confirmed) return;

    setRefundingOrderId(order._id);
    try {
      const response = await api.post('/payments/refund', {
        orderId: order._id,
        reason: 'Full refund approved from the admin order console',
      });
      if (response.data.success) {
        await loadOrders();
        setRefundRequestModalOpen(false);
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Stripe refund failed', {
        title: 'Refund Failed',
      });
    } finally {
      setRefundingOrderId('');
    }
  };

  const openRefundRequest = (order) => {
    setRefundRequestOrder(order);
    setRefundAdminNote(order.refundRequest?.adminNote || '');
    setRefundRequestModalOpen(true);
  };

  const handleRefundRequestAction = async (action) => {
    if (action === 'REJECT' && refundAdminNote.trim().length < 5) {
      showAlert('Please provide a reason before rejecting the request.', {
        type: 'warning',
        title: 'Reason Required',
      });
      return;
    }

    setReviewingRefund(true);
    try {
      const response = await api.patch(
        `/orders/admin/${refundRequestOrder._id}/refund-request`,
        { action, adminNote: refundAdminNote }
      );
      if (response.data.success) {
        setRefundRequestOrder(response.data.order);
        await loadOrders();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Could not update the refund request');
    } finally {
      setReviewingRefund(false);
    }
  };

  const handleExchangeAction = async (request, status) => {
    const confirmed = await showConfirm(
      `Move this exchange from ${request.status} to ${status}?`,
      { title: 'Update Exchange', confirmLabel: status.replace(/_/g, ' ') }
    );
    if (!confirmed) return;
    try {
      const response = await api.patch(
        `/orders/admin/${detailOrder._id}/exchanges/${request._id}`,
        { status }
      );
      setDetailOrder(response.data.order);
      await loadOrders();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Could not update the exchange request');
    }
  };

  const handleItemRequestAction = async (request, action) => {
    const adminNote = (itemRequestNotes[request._id] || '').trim();
    if (action === 'REJECT' && adminNote.length < 5) {
      showAlert('Add a short reason before rejecting this request.', { title: 'Reason Required' });
      return;
    }
    const confirmed = await showConfirm(
      `${action.replace(/_/g, ' ')} this ${request.type.toLowerCase()} request for ${request.productName}?`,
      { title: 'Update Item Request', confirmLabel: action.replace(/_/g, ' ') }
    );
    if (!confirmed) return;
    setProcessingItemRequest(request._id);
    try {
      const response = await api.patch(
        `/orders/admin/${detailOrder._id}/item-returns/${request._id}`,
        { action, adminNote }
      );
      setDetailOrder(response.data.order);
      await loadOrders();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Could not update the item request');
    } finally {
      setProcessingItemRequest('');
    }
  };

  const handleItemRefund = async (request) => {
    const amount = formatMoney(request.refundAmount || 0, detailOrder.currency);
    const confirmed = await showConfirm(
      `Issue a ${amount} Stripe refund for ${request.productName}? This cannot be reversed.`,
      { title: 'Confirm Partial Refund', confirmLabel: `Refund ${amount}` }
    );
    if (!confirmed) return;
    setProcessingItemRequest(request._id);
    try {
      const response = await api.post('/payments/refund', {
        orderId: detailOrder._id,
        itemReturnRequestId: request._id,
        reason: request.type === 'RETURN' ? 'Approved item return' : 'Approved item cancellation',
      });
      if (response.data.success) {
        const refreshed = await api.get(`/orders/${detailOrder._id}`);
        setDetailOrder(refreshed.data.order);
        await loadOrders();
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Stripe partial refund failed', { title: 'Refund Failed' });
    } finally {
      setProcessingItemRequest('');
    }
  };

  const statusOptions = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ];

  const allowedStatusTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
  };

  return (
    <AdminLayout title="Fulfillment & Order Control">
      <div className="space-y-6">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <SelectDropdown
              value={statusFilter}
              onChange={(nextStatus) => {
                setStatusFilter(nextStatus);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                ...statusOptions.map((status) => ({
                  value: status,
                  label: status.replace(/_/g, ' '),
                })),
              ]}
              ariaLabel="Filter orders by status"
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Order Ref</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4 text-right">Total</th>
                  <th className="py-4 px-6 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">
                        {o.shippingAddress?.fullName || o.user?.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{o.user?.email}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <OrderStatusBadge status={o.orderStatus} />
                      {o.refundRequest && !['REJECTED', 'COMPLETED'].includes(o.refundRequest.status) && (
                        <button
                          onClick={() => openRefundRequest(o)}
                          className="mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase text-amber-700 hover:text-amber-900"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {o.refundRequest.type} {o.refundRequest.status.replace(/_/g, ' ')}
                        </button>
                      )}
                      {o.exchangeRequests?.some((request) => !['REJECTED', 'COMPLETED'].includes(request.status)) && (
                        <button
                          onClick={() => { setDetailOrder(o); setDetailModalOpen(true); }}
                          className="mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase text-blue-700 hover:text-blue-900"
                        >
                          Exchange action required
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold uppercase text-[10px] text-slate-700">
                        {o.paymentMethod} •{' '}
                        <span className={o.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                          {o.paymentStatus}
                        </span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                      {formatMoney(o.totalAmount, o.currency)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-lg text-[11px] font-bold uppercase transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                        {o.refundRequest && !['REJECTED', 'COMPLETED'].includes(o.refundRequest.status) && (
                          <button
                            onClick={() => openRefundRequest(o)}
                            className="px-3 py-1.5 border border-amber-200 text-amber-800 hover:bg-amber-50 rounded-lg text-[11px] font-bold uppercase transition"
                          >
                            Refund Request
                          </button>
                        )}
                        {o.orderStatus !== 'REFUNDED' && (
                          <button
                            onClick={() => handleOpenStatusModal(o)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase transition"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order Details #${detailOrder?.orderNumber || ''}`}
        maxWidth="max-w-4xl"
      >
        {detailOrder && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Placed</p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {new Date(detailOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={detailOrder.orderStatus} />
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                  detailOrder.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {detailOrder.paymentMethod} · {detailOrder.paymentStatus}
                </span>
              </div>
            </div>

            <section>
              <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Items to fulfil
              </h4>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                {detailOrder.orderItems?.map((item, index) => (
                  <div key={`${item.product || item.name}-${index}`} className="flex gap-4 p-4">
                    <img
                      src={item.image || '/image-placeholder.svg'}
                      alt={item.name}
                      className="h-24 w-20 flex-shrink-0 rounded-xl bg-slate-100 object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/image-placeholder.svg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Unit price: {formatMoney(item.price || 0, detailOrder.currency)}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900">{formatMoney(item.total || 0, detailOrder.currency)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          Size: {item.selectedSize || 'Not specified'}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                          Colour: {item.selectedColor || 'Not specified'}
                        </span>
                        <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                          Quantity: {item.quantity}
                        </span>
                        {item.variantSku && (
                          <span className="rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-600">
                            SKU: {item.variantSku}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 p-5">
                <h4 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <MapPin className="h-4 w-4" /> Delivery details
                </h4>
                <div className="space-y-2 text-xs leading-5 text-slate-600">
                  <p className="font-bold text-slate-900">{detailOrder.shippingAddress?.fullName}</p>
                  <p>
                    {detailOrder.shippingAddress?.streetAddress}
                    {detailOrder.shippingAddress?.apartment ? `, ${detailOrder.shippingAddress.apartment}` : ''}
                    <br />
                    {detailOrder.shippingAddress?.city}, {detailOrder.shippingAddress?.state} {detailOrder.shippingAddress?.postalCode}
                    <br />
                    {detailOrder.shippingAddress?.country}
                  </p>
                  {detailOrder.shippingAddress?.phone && (
                    <a href={`tel:${detailOrder.shippingAddress.phone}`} className="flex items-center gap-2 font-medium text-slate-800 hover:text-amber-700">
                      <Phone className="h-3.5 w-3.5" /> {detailOrder.shippingAddress.phone}
                    </a>
                  )}
                  {detailOrder.user?.email && (
                    <a href={`mailto:${detailOrder.user.email}`} className="flex items-center gap-2 font-medium text-slate-800 hover:text-amber-700">
                      <Mail className="h-3.5 w-3.5" /> {detailOrder.user.email}
                    </a>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h4 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  <CreditCard className="h-4 w-4" /> Payment summary
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(detailOrder.subtotal || 0, detailOrder.currency)}</span></div>
                  {detailOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount{detailOrder.couponCode ? ` (${detailOrder.couponCode})` : ''}</span>
                      <span>−{formatMoney(detailOrder.discountAmount, detailOrder.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between"><span>Shipping</span><span>{formatMoney(detailOrder.shippingAmount || 0, detailOrder.currency)}</span></div>
                  <div className="flex justify-between"><span>{detailOrder.pricesIncludeVat ? 'VAT included' : 'VAT'}</span><span>{formatMoney(detailOrder.taxAmount || 0, detailOrder.currency)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-extrabold text-slate-950">
                    <span>Total</span><span>{formatMoney(detailOrder.totalAmount || 0, detailOrder.currency)}</span>
                  </div>
                  {(detailOrder.paymentResult?.transactionId || detailOrder.paymentResult?.id) && (
                    <p className="break-all border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                      Transaction: {detailOrder.paymentResult.transactionId || detailOrder.paymentResult.id}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {(detailOrder.carrier || detailOrder.trackingNumber) && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
                <strong>Courier:</strong> {detailOrder.carrier || 'Not assigned'}
                {detailOrder.trackingNumber && <> · <strong>Tracking:</strong> {detailOrder.trackingNumber}</>}
              </div>
            )}

            {detailOrder.exchangeRequests?.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Exchange requests</h4>
                {detailOrder.exchangeRequests.map((request) => {
                  const nextActions = {
                    REQUESTED: ['APPROVED', 'REJECTED'],
                    APPROVED: ['RECEIVED'],
                    RECEIVED: ['SHIPPED'],
                    SHIPPED: ['COMPLETED'],
                  }[request.status] || [];
                  return (
                    <div key={request._id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{request.productName}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-amber-800">{request.status}</span>
                      </div>
                      <p className="mt-2 text-slate-700">
                        {request.fromColor || 'Default'} / {request.fromSize || 'One size'} → {request.toColor || 'Default'} / {request.toSize || 'One size'}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-slate-500">Replacement SKU: {request.toVariantSku}</p>
                      <p className="mt-2 text-slate-600">Reason: {request.reason}</p>
                      {nextActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {nextActions.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleExchangeAction(request, status)}
                              className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase ${
                                status === 'REJECTED'
                                  ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {status.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {detailOrder.itemReturnRequests?.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Item returns & cancellations</h4>
                {detailOrder.itemReturnRequests.map((request) => {
                  const canRefund = (request.type === 'CANCELLATION' && request.status === 'APPROVED')
                    || (request.type === 'RETURN' && request.status === 'RECEIVED');
                  return (
                    <div key={request._id} className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{request.productName} · Qty {request.quantity}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-rose-800">{request.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="mt-2 text-slate-700">{request.type} · Refund {formatMoney(request.refundAmount || 0, detailOrder.currency)}</p>
                      <p className="mt-1 text-slate-600">Customer reason: {request.reason}</p>
                      {request.variantSku && <p className="mt-1 font-mono text-[10px] text-slate-500">SKU: {request.variantSku}</p>}
                      {!['COMPLETED', 'REFUND_PENDING'].includes(request.status) && (
                        <textarea
                          rows={2}
                          value={itemRequestNotes[request._id] ?? request.adminNote ?? ''}
                          onChange={(event) => setItemRequestNotes((current) => ({ ...current, [request._id]: event.target.value }))}
                          placeholder="Administrator note (required when rejecting)"
                          className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs"
                        />
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.status === 'REQUESTED' && (
                          <>
                            <button type="button" disabled={processingItemRequest === request._id} onClick={() => handleItemRequestAction(request, 'APPROVE')} className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">Approve</button>
                            <button type="button" disabled={processingItemRequest === request._id} onClick={() => handleItemRequestAction(request, 'REJECT')} className="rounded-lg border border-rose-300 px-3 py-2 text-[10px] font-bold uppercase text-rose-700 disabled:opacity-50">Reject</button>
                          </>
                        )}
                        {request.type === 'RETURN' && request.status === 'APPROVED' && (
                          <button type="button" disabled={processingItemRequest === request._id} onClick={() => handleItemRequestAction(request, 'MARK_RECEIVED')} className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">Mark received & restock</button>
                        )}
                        {canRefund && (
                          <button type="button" disabled={processingItemRequest === request._id} onClick={() => handleItemRefund(request)} className="rounded-lg bg-rose-700 px-3 py-2 text-[10px] font-bold uppercase text-white disabled:opacity-50">Issue Stripe refund</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Update Order #${selectedOrder?.orderNumber}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Order Status *
            </label>
            <SelectDropdown
              value={newStatus}
              onChange={setNewStatus}
              options={[
                selectedOrder?.orderStatus,
                ...(allowedStatusTransitions[selectedOrder?.orderStatus] || []),
              ]
                .filter(Boolean)
                .filter((status, index, values) => values.indexOf(status) === index)
                .filter((status) => !(selectedOrder?.isPaid && status === 'CANCELLED'))
                .map((status) => ({
                  value: status,
                  label: status.replace(/_/g, ' '),
                }))}
              ariaLabel="Order status"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Courier Carrier Name
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. DHL Express Worldwide / FedEx Priority"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Tracking Reference Code
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DHL-9823-1182-99"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Status Change Log Note
            </label>
            <textarea
              rows={2}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Handed over to courier facility at JFK terminal"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md disabled:opacity-50"
          >
            {updating ? 'Saving Status...' : 'Apply Status Update'}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={refundRequestModalOpen}
        onClose={() => setRefundRequestModalOpen(false)}
        title={`Refund Request #${refundRequestOrder?.orderNumber || ''}`}
      >
        {refundRequestOrder?.refundRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
              <div className="flex justify-between gap-3">
                <span className="font-bold uppercase">{refundRequestOrder.refundRequest.type}</span>
                <span className="font-bold uppercase">{refundRequestOrder.refundRequest.status.replace(/_/g, ' ')}</span>
              </div>
              <p><strong>Customer reason:</strong> {refundRequestOrder.refundRequest.reason}</p>
              <p><strong>Full refund:</strong> {formatMoney(refundRequestOrder.totalAmount, refundRequestOrder.currency)}</p>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Administrator Note
              </label>
              <textarea
                rows={3}
                value={refundAdminNote}
                onChange={(event) => setRefundAdminNote(event.target.value)}
                placeholder="Return instructions, approval notes, or rejection reason"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {refundRequestOrder.refundRequest.status === 'REQUESTED' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={reviewingRefund}
                  onClick={() => handleRefundRequestAction('REJECT')}
                  className="py-3 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs uppercase font-bold disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={reviewingRefund}
                  onClick={() => handleRefundRequestAction('APPROVE')}
                  className="py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs uppercase font-bold disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            )}

            {refundRequestOrder.refundRequest.type === 'RETURN' &&
              refundRequestOrder.refundRequest.status === 'APPROVED' && (
                <button
                  type="button"
                  disabled={reviewingRefund}
                  onClick={() => handleRefundRequestAction('MARK_RECEIVED')}
                  className="w-full py-3 bg-amber-600 text-white hover:bg-amber-500 rounded-xl text-xs uppercase font-bold disabled:opacity-50"
                >
                  Mark Returned Parcel Received
                </button>
              )}

            {((refundRequestOrder.refundRequest.type === 'CANCELLATION' &&
              refundRequestOrder.refundRequest.status === 'APPROVED') ||
              (refundRequestOrder.refundRequest.type === 'RETURN' &&
                refundRequestOrder.refundRequest.status === 'RECEIVED')) && (
              <button
                type="button"
                disabled={refundingOrderId === refundRequestOrder._id}
                onClick={() => handleRefund(refundRequestOrder)}
                className="w-full py-3 bg-rose-600 text-white hover:bg-rose-500 rounded-xl text-xs uppercase font-bold disabled:opacity-50"
              >
                {refundingOrderId === refundRequestOrder._id
                  ? 'Refunding Through Stripe...'
                  : `Issue Full Stripe Refund (${formatMoney(refundRequestOrder.totalAmount, refundRequestOrder.currency)})`}
              </button>
            )}

            {refundRequestOrder.refundRequest.status === 'REFUND_PENDING' && (
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Stripe is processing this refund. The order will update automatically through the webhook.
              </p>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};
