import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { ImageUpload } from '../../components/common/ImageUpload';
import { SelectDropdown } from '../../components/common/SelectDropdown';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';

export const AdminProductsPage = () => {
  const { showAlert, showConfirm } = useApplicationAlert();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    category: '',
    sku: '',
    stock: 10,
    sizes: 'XS, S, M, L, XL',
    colors: '',
    images: [],
    isFeatured: false,
    isActive: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products/admin?page=${page}&limit=15&search=${encodeURIComponent(search)}`),
        api.get('/categories/admin'),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        setTotalPages(prodRes.data.pages || 1);
      }
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: '',
      discountPrice: '',
      category: categories[0]?._id || '',
      sku: `AUR-${Date.now().toString().slice(-4)}`,
      stock: 10,
      sizes: 'XS, S, M, L, XL',
      colors: '',
      images: [],
      isFeatured: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription || '',
      price: p.price,
      discountPrice: p.discountPrice || '',
      category: p.category?._id || p.category,
      sku: p.sku || '',
      stock: p.stock,
      sizes: p.sizes?.join(', ') || 'XS, S, M, L, XL',
      colors: p.colors?.join(', ') || '',
      images: p.images || [],
      isFeatured: p.isFeatured,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        sizes: typeof formData.sizes === 'string'
          ? formData.sizes.split(',').map((s) => s.trim()).filter(Boolean)
          : formData.sizes,
        colors: typeof formData.colors === 'string'
          ? formData.colors.split(',').map((c) => c.trim()).filter(Boolean)
          : formData.colors,
        images: formData.images,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      await loadData();
      setModalOpen(false);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'This product and its catalog information will be permanently removed.',
      { title: 'Delete Product?', confirmLabel: 'Delete Product' }
    );
    if (confirmed) {
      try {
        await api.delete(`/products/${id}`);
        await loadData();
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/products/${id}/toggle-status`);
      await loadData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <AdminLayout title="Product Catalog Management">
      <div className="space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Masterwork</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Featured</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.images?.[0] || '/image-placeholder.svg'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900">${p.price.toFixed(2)}</span>
                      {p.discountPrice && (
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          Disc: ${p.discountPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`font-black px-2 py-0.5 rounded text-[11px] ${
                          p.stock <= 5
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      {p.isFeatured ? (
                        <span className="flex items-center text-amber-600 font-bold text-[10px]">
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Masterwork' : 'New Masterwork'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Category *
              </label>
              <SelectDropdown
                value={formData.category}
                onChange={(category) => setFormData({ ...formData, category })}
                options={categories.map((category) => ({
                  value: category._id,
                  label: category.name,
                }))}
                placeholder="Select a category"
                ariaLabel="Product category"
                required
                disabled={!categories.length}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Regular Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Discount Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Inventory Units *
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={formData.sizes}
                placeholder="XS, S, M, L, XL"
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Color Options (comma-separated)
              </label>
              <input
                type="text"
                value={formData.colors}
                placeholder="Camel Heather, Obsidian, Slate Grey"
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Short Summary Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Full Description *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <ImageUpload
            label="Product Gallery"
            value={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
            purpose="products"
            multiple
            maxFiles={8}
            required
            aspectClass="aspect-square"
          />

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="font-semibold text-slate-800">Featured on Homepage</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="font-semibold text-slate-800">Active (Visible to public)</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md"
          >
            {editingProduct ? 'Save Changes' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
};
