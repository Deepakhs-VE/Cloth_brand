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
      if (user?.role === 'seller' && profile.data.seller.status === 'APPROVED') {
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

  return <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Seller portal</p><h1 className="font-luxury text-4xl font-bold text-slate-900">{seller.storeName}</h1></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{seller.status}</span></div>
    {seller.status !== 'APPROVED' ? <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your application is {seller.status.toLowerCase()}. An administrator must approve it before you can manage and publish products.</div> : <>
      <p className="mt-4 text-sm text-slate-600">Manage your catalog, organize categories and keep your inventory up to date.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Products', 'products'], ['Published', 'active'], ['Low stock (5 or fewer)', 'lowStock'], ['Units in stock', 'units']].map(([label, key]) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{dashboard?.stats?.[key] ?? 0}</p></div>)}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/seller/products" className="rounded-2xl bg-slate-900 p-6 text-white"><h2 className="text-lg font-bold">Manage products</h2><p className="mt-2 text-sm text-slate-300">Add products, upload photos, set prices and manage sizes, colours and stock.</p><span className="mt-4 inline-block text-sm font-bold text-amber-300">Open my catalog &rarr;</span></Link>
        <Link to="/seller/categories" className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-900">Manage categories</h2><p className="mt-2 text-sm text-slate-600">Create categories and subcategories with images, size presets and return policies, or use shared categories.</p><span className="mt-4 inline-block text-sm font-bold text-amber-700">Browse categories &rarr;</span></Link>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Recently updated products</h2><div className="mt-3 space-y-2">{dashboard?.recentProducts?.length ? dashboard.recentProducts.map((product) => <Link to={`/seller/products?edit=${product._id}`} key={product._id} className="flex items-center justify-between gap-4 border-t border-slate-100 py-3 text-sm"><span className="font-semibold">{product.name}</span><span>{product.stock} in stock &middot; {product.isActive ? 'Published' : 'Hidden'}</span></Link>) : <p className="text-sm text-slate-500">Your catalog is empty. Add your first product to get started.</p>}</div></div>
    </>}
  </section>;
};
