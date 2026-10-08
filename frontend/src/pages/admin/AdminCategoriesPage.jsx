import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { ImageUpload } from '../../components/common/ImageUpload';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';

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
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
      } else {
        await api.post('/categories', formData);
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
                  <p className="font-mono text-[10px] text-amber-700 mb-2">/products?category={cat.slug}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
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
