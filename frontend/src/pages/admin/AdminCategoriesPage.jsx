import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { ImageUpload } from '../../components/common/ImageUpload';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';
import { SelectDropdown } from '../../components/common/SelectDropdown';

export const AdminCategoriesPage = () => {
  const { showAlert, showConfirm } = useApplicationAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    displayOrder: 0,
    isActive: true,
    defaultSizeSystem: 'alpha',
    defaultSizes: 'XS, S, M, L, XL, XXL',
    parent: '',
    audience: 'all',
    attributeDefinitions: [],
    defaultReturnPolicy: { returnable: true, exchangeable: true, returnWindowDays: 30, exchangeWindowDays: 30 },
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories/admin');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      displayOrder: categories.length + 1,
      isActive: true,
      defaultSizeSystem: 'alpha',
      defaultSizes: 'XS, S, M, L, XL, XXL',
      parent: '',
      audience: 'all',
      attributeDefinitions: [],
      defaultReturnPolicy: { returnable: true, exchangeable: true, returnWindowDays: 30, exchangeWindowDays: 30 },
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      description: c.description || '',
      image: c.image || '',
      displayOrder: c.displayOrder || 0,
      isActive: c.isActive,
      defaultSizeSystem: c.defaultSizeSystem || 'alpha',
      defaultSizes: c.defaultSizes?.join(', ') || '',
      parent: c.parent?._id || c.parent || '',
      audience: c.audience || 'all',
      attributeDefinitions: (c.attributeDefinitions || []).map((attribute) => ({
        ...attribute,
        optionsText: (attribute.options || []).join(', '),
      })),
      defaultReturnPolicy: {
        returnable: c.defaultReturnPolicy?.returnable !== false,
        exchangeable: c.defaultReturnPolicy?.exchangeable !== false,
        returnWindowDays: c.defaultReturnPolicy?.returnWindowDays ?? 30,
        exchangeWindowDays: c.defaultReturnPolicy?.exchangeWindowDays ?? 30,
      },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parent: formData.parent || null,
        defaultSizes: formData.defaultSizes.split(',').map((size) => size.trim()).filter(Boolean),
        attributeDefinitions: formData.attributeDefinitions.map(({ optionsText, ...attribute }) => ({
          ...attribute,
          key: attribute.key.trim(),
          label: attribute.label.trim(),
          options: String(optionsText || '').split(',').map((value) => value.trim()).filter(Boolean),
        })).filter((attribute) => attribute.key && attribute.label),
      };
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      await loadCategories();
      setModalOpen(false);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Products assigned to this category may no longer appear in category browsing.',
      { title: 'Delete Category?', confirmLabel: 'Delete Category' }
    );
    if (confirmed) {
      try {
        await api.delete(`/categories/${id}`);
        await loadCategories();
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error deleting category');
      }
    }
  };

  return (
    <AdminLayout title="Product Categories">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">
            Manage your store navigation structure and thematic product groupings
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden relative">
                <img
                  src={cat.image || '/image-placeholder.svg'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Order: #{cat.displayOrder}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase text-slate-400">
                    Sizes: {cat.defaultSizes?.join(', ') || 'Configured per product'}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase text-slate-400">
                    {cat.parent?.name ? `${cat.parent.name} → ` : ''}{cat.audience || 'all'}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Parent Category</label>
              <SelectDropdown
                value={formData.parent}
                onChange={(parent) => setFormData({ ...formData, parent })}
                options={[
                  { value: '', label: 'Top-level category' },
                  ...categories.filter((category) => category._id !== editingCategory?._id).map((category) => ({ value: category._id, label: category.name })),
                ]}
                ariaLabel="Parent category"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Audience</label>
              <SelectDropdown
                value={formData.audience}
                onChange={(audience) => setFormData({ ...formData, audience })}
                options={['all', 'women', 'men', 'girls', 'boys', 'unisex'].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))}
                ariaLabel="Category audience"
              />
            </div>
          </div>

          <ImageUpload
            label="Category Banner"
            value={formData.image}
            onChange={(image) => setFormData({ ...formData, image })}
            purpose="categories"
            required
          />

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Display Sequence Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Default Size System</label>
              <SelectDropdown
                value={formData.defaultSizeSystem}
                onChange={(defaultSizeSystem) => setFormData({ ...formData, defaultSizeSystem })}
                options={[
                  { value: 'alpha', label: 'Clothing (XS–XXL)' },
                  { value: 'waist', label: 'Waist / Jeans' },
                  { value: 'shoe', label: 'Footwear' },
                  { value: 'one_size', label: 'One Size' },
                  { value: 'custom', label: 'Custom' },
                ]}
                ariaLabel="Category default size system"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Default Sizes</label>
              <input
                value={formData.defaultSizes}
                onChange={(e) => setFormData({ ...formData, defaultSizes: e.target.value })}
                placeholder="XS, S, M, L, XL"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-800">Category Attributes</h4>
                <p className="mt-1 text-[10px] text-slate-500">Define reusable fashion fields and filter options for products in this category.</p>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, attributeDefinitions: [...formData.attributeDefinitions, { key: '', label: '', optionsText: '', isFilterable: true, isRequired: false }] })} className="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-bold uppercase">Add Field</button>
            </div>
            {formData.attributeDefinitions.map((attribute, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
                <input value={attribute.key} onChange={(e) => setFormData({ ...formData, attributeDefinitions: formData.attributeDefinitions.map((entry, entryIndex) => entryIndex === index ? { ...entry, key: e.target.value.toLowerCase().replace(/\s+/g, '_') } : entry) })} placeholder="pattern" className="rounded-lg border border-slate-200 bg-white p-2 text-xs" />
                <input value={attribute.label} onChange={(e) => setFormData({ ...formData, attributeDefinitions: formData.attributeDefinitions.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: e.target.value } : entry) })} placeholder="Pattern" className="rounded-lg border border-slate-200 bg-white p-2 text-xs" />
                <input value={attribute.optionsText || ''} onChange={(e) => setFormData({ ...formData, attributeDefinitions: formData.attributeDefinitions.map((entry, entryIndex) => entryIndex === index ? { ...entry, optionsText: e.target.value } : entry) })} placeholder="Solid, Striped, Printed" className="rounded-lg border border-slate-200 bg-white p-2 text-xs" />
                <button type="button" onClick={() => setFormData({ ...formData, attributeDefinitions: formData.attributeDefinitions.filter((_, entryIndex) => entryIndex !== index) })} className="p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-800">Default Returns</h4>
            <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.defaultReturnPolicy.returnable} onChange={(e) => setFormData({ ...formData, defaultReturnPolicy: { ...formData.defaultReturnPolicy, returnable: e.target.checked } })} /> Returnable</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.defaultReturnPolicy.exchangeable} onChange={(e) => setFormData({ ...formData, defaultReturnPolicy: { ...formData.defaultReturnPolicy, exchangeable: e.target.checked } })} /> Exchangeable</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="14" value={formData.defaultReturnPolicy.returnWindowDays} onChange={(e) => setFormData({ ...formData, defaultReturnPolicy: { ...formData.defaultReturnPolicy, returnWindowDays: Number(e.target.value) } })} placeholder="Return days (minimum 14)" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs" />
              <input type="number" min="0" value={formData.defaultReturnPolicy.exchangeWindowDays} onChange={(e) => setFormData({ ...formData, defaultReturnPolicy: { ...formData.defaultReturnPolicy, exchangeWindowDays: Number(e.target.value) } })} placeholder="Exchange days" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-slate-900"
            />
            <label htmlFor="catActive" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Active Category
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md"
          >
            {editingCategory ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
};
