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
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { OrderStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { SelectDropdown } from '../../components/common/SelectDropdown';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';

export const AdminOrdersPage = () => {
  const { showAlert, showConfirm } = useApplicationAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      `A full refund of $${order.totalAmount.toFixed(2)} will be issued through Stripe for order ${order.orderNumber}. This action cannot be reversed.`,
      {
        title: 'Confirm Stripe Refund',
        confirmLabel: `Refund $${order.totalAmount.toFixed(2)}`,
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
                      ${o.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
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
              <p><strong>Full refund:</strong> ${refundRequestOrder.totalAmount.toFixed(2)}</p>
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
                  : `Issue Full Stripe Refund ($${refundRequestOrder.totalAmount.toFixed(2)})`}
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
