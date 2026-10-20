import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApplicationAlert } from '../context/ApplicationAlertContext';

export const SellerPortalPage = () => {
  const { user } = useAuth();
  const { showAlert } = useApplicationAlert();
  const [seller, setSeller] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    storeName: '', legalBusinessName: '', supportEmail: user?.email || '', supportPhone: user?.phone || '',
    vatNumber: '', businessAddress: { streetAddress: '', city: '', postalCode: '', countryCode: 'IE' },
  });

  const load = async () => {
    try {
      const profile = await api.get('/sellers/me');
      setSeller(profile.data.seller);
      if (user?.role === 'seller') {
        const result = await api.get('/sellers/dashboard');
        setDashboard(result.data);
      }
    } catch (error) {
      if (error.response?.status !== 404) showAlert(error.response?.data?.message || 'Could not load seller profile');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user?.role]);

  const apply = async (event) => {
    event.preventDefault();
    try {
      const result = await api.post('/sellers/apply', form);
      setSeller(result.data.seller); showAlert(result.data.message);
    } catch (error) { showAlert(error.response?.data?.message || 'Could not submit application'); }
  };
  const startOnboarding = async () => {
    try {
      const result = await api.post('/sellers/stripe/onboarding', { countryCode: seller?.businessAddress?.countryCode || 'IE' });
      window.location.assign(result.data.onboardingUrl);
    } catch (error) { showAlert(error.response?.data?.message || 'Could not begin Stripe onboarding'); }
  };
  const syncStripe = async () => {
    try { const result = await api.post('/sellers/stripe/sync'); setSeller(result.data.seller); showAlert('Stripe account status updated'); }
    catch (error) { showAlert(error.response?.data?.message || 'Could not refresh Stripe status'); }
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-sm text-slate-500">Loading seller portal…</div>;
  if (!seller) return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-luxury text-4xl font-bold text-slate-900">Become a seller</h1>
      <p className="mt-3 text-sm text-slate-600">Apply to sell on the marketplace. Your business will be reviewed before products can be published.</p>
      <form onSubmit={apply} className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        {[['storeName', 'Store name'], ['legalBusinessName', 'Legal business name'], ['supportEmail', 'Support email'], ['supportPhone', 'Support phone'], ['vatNumber', 'VAT number']].map(([key, label]) => <label key={key} className="text-xs font-bold text-slate-700">{label}<input required={key !== 'vatNumber'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" /></label>)}
        <label className="text-xs font-bold text-slate-700">Country code<input required maxLength="2" value={form.businessAddress.countryCode} onChange={(e) => setForm({ ...form, businessAddress: { ...form.businessAddress, countryCode: e.target.value.toUpperCase() } })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" /></label>
        <button className="self-end rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Submit application</button>
      </form>
    </section>
  );

  const stripeReady = seller.stripe?.payoutsEnabled;
  return <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Seller portal</p><h1 className="font-luxury text-4xl font-bold text-slate-900">{seller.storeName}</h1></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{seller.status}</span></div>
    {seller.status !== 'APPROVED' ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your application is {seller.status.toLowerCase()}. An administrator must approve it before you can onboard with Stripe or sell products.</div> : <>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Stripe payouts</h2><p className="mt-1 text-sm text-slate-600">{stripeReady ? 'Your Stripe payout account is ready.' : 'Complete Stripe verification before receiving payouts.'}</p><div className="mt-4 flex gap-3"><button onClick={startOnboarding} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">{seller.stripe?.accountId ? 'Continue Stripe onboarding' : 'Connect Stripe account'}</button>{seller.stripe?.accountId && <button onClick={syncStripe} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold">Refresh status</button>}</div></div>
      <div className="mt-6 flex items-center justify-between gap-4"><div className="grid flex-1 gap-4 sm:grid-cols-3">{['HELD', 'ELIGIBLE', 'PAID'].map((status) => <div key={status} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">{status}</p><p className="mt-2 text-2xl font-black text-slate-900">{Number(dashboard?.balances?.[status] || 0).toFixed(2)}</p></div>)}</div><Link to="/seller/products" className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white">Manage catalog</Link></div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Recent marketplace orders</h2><div className="mt-3 space-y-2">{dashboard?.orders?.length ? dashboard.orders.map((order) => <div key={order._id} className="flex justify-between border-t border-slate-100 py-3 text-sm"><span>{order.orderNumber}</span><span className="font-semibold">{order.orderStatus}</span></div>) : <p className="text-sm text-slate-500">No seller orders yet.</p>}</div></div>
    </>}
  </section>;
};
