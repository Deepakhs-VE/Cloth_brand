import React from 'react';

export const OrderStatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-800 border-blue-200',
    PROCESSING: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    SHIPPED: 'bg-purple-50 text-purple-800 border-purple-200',
    OUT_FOR_DELIVERY: 'bg-teal-50 text-teal-800 border-teal-200',
    DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
    REFUNDED: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${currentStyle}`}
    >
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
};

export const PaymentStatusBadge = ({ status }) => {
  const styles = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
    REFUNDED: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${currentStyle}`}
    >
      {status || 'PENDING'}
    </span>
  );
};
