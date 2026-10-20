import React, { useEffect, useState } from 'react';
import { Store, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SelectDropdown } from '../../components/common/SelectDropdown';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';

export const AdminSellersPage = () => {
  const { showAlert } = useApplicationAlert();
  const [sellers, setSellers] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setLoading(true); const [result, settlementResult] = await Promise.all([api.get('/sellers/admin'), api.get('/sellers/admin/settlements')]); setSellers(result.data.sellers || []); setSettlements(settlementResult.data.settlements || []); }
    catch (error) { showAlert(error.response?.data?.message || 'Could not load sellers'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const update = async (seller, changes) => {
    try { await api.patch(`/sellers/admin/${seller._id}`, changes); await load(); }
    catch (error) { showAlert(error.response?.data?.message || 'Could not update seller'); }
  };
  const pay = async (settlement) => {
    try { await api.post(`/sellers/admin/settlements/${settlement._id}/payout`); showAlert('Stripe payout created'); await load(); }
    catch (error) { showAlert(error.response?.data?.message || 'Could not create payout'); }
  };
  return <AdminLayout title="Marketplace Sellers">
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-luxury text-3xl font-bold text-slate-900">Sellers</h1><p className="mt-1 text-sm text-slate-600">Approve stores, set marketplace commission, and monitor Stripe verification.</p></div><button onClick={load} className="rounded-xl border border-slate-300 p-3"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
      {loading ? <div className="py-20 text-center text-sm text-slate-500">Loading sellers…</div> : <><div className="grid gap-4">{sellers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No seller applications yet.</div> : sellers.map((seller) => <article key={seller._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-xl bg-slate-900 p-3 text-white"><Store className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">{seller.storeName}</h2><p className="text-sm text-slate-500">{seller.legalBusinessName} · {seller.user?.email}</p><p className="mt-1 text-xs text-slate-500">VAT: {seller.vatNumber || 'Not supplied'} · Stripe payouts: {seller.stripe?.payoutsEnabled ? 'Ready' : 'Not complete'}</p></div></div><div className="grid grid-cols-2 gap-3"><SelectDropdown value={seller.status} onChange={(status) => update(seller, { status })} options={['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((value) => ({ value, label: value }))} ariaLabel={`Status for ${seller.storeName}`} /><label className="text-xs font-bold text-slate-600">Commission %<input type="number" min="0" max="100" defaultValue={seller.commissionRate} onBlur={(e) => { if (Number(e.target.value) !== Number(seller.commissionRate)) update(seller, { commissionRate: Number(e.target.value) }); }} className="mt-1 block w-28 rounded-lg border border-slate-200 p-2 font-normal" /></label></div></div></article>)}</div><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Seller settlements</h2><div className="mt-3 space-y-2">{settlements.length ? settlements.map((settlement) => <div key={settlement._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 text-sm"><span>{settlement.seller?.storeName || 'Seller'} · {settlement.order?.orderNumber || 'Order'}</span><span>{settlement.currency} {Number(settlement.netAmount).toFixed(2)} · {settlement.status}</span>{settlement.status === 'ELIGIBLE' && <button onClick={() => pay(settlement)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Pay seller</button>}</div>) : <p className="text-sm text-slate-500">No seller settlements yet.</p>}</div></section></>}
    </div>
  </AdminLayout>;
};
