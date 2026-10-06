import React, { useState, useEffect } from 'react';
import { Quote, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Modal } from '../../components/common/Modal';
import { StarRating } from '../../components/common/StarRating';

export const AdminTestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    roleOrCompany: '',
    avatar: '',
    rating: 5,
    reviewText: '',
    isActive: true,
    displayOrder: 1,
  });

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/testimonials/admin');
      if (res.data.success) {
        setTestimonials(res.data.testimonials);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleOpenAdd = () => {
    setEditingTestimonial(null);
    setFormData({
      clientName: '',
      roleOrCompany: 'Verified Patron',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
      reviewText: '',
      isActive: true,
      displayOrder: testimonials.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTestimonial(t);
    setFormData({
      clientName: t.clientName,
      roleOrCompany: t.roleOrCompany || '',
      avatar: t.avatar || '',
      rating: t.rating || 5,
      reviewText: t.reviewText,
      isActive: t.isActive,
      displayOrder: t.displayOrder || 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await api.put(`/testimonials/${editingTestimonial._id}`, formData);
      } else {
        await api.post('/testimonials', formData);
      }
      await loadTestimonials();
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving testimonial');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this testimonial?')) {
      try {
        await api.delete(`/testimonials/${id}`);
        await loadTestimonials();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting testimonial');
      }
    }
  };

  return (
    <AdminLayout title="Client Testimonials & Endorsements">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">
            Manage public testimonials and editorial endorsements displayed across the homepage
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t._id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={t.clientName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{t.clientName}</h3>
                    <p className="text-xs text-slate-400">{t.roleOrCompany}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <StarRating rating={t.rating} size="w-3.5 h-3.5" />
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{t.reviewText}"
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.isActive ? 'Active' : 'Disabled'}
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={formData.roleOrCompany}
                onChange={(e) => setFormData({ ...formData, roleOrCompany: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Avatar Image URL
            </label>
            <input
              type="text"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Testimonial Endorsement *
            </label>
            <textarea
              rows={4}
              required
              value={formData.reviewText}
              onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="testActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-slate-900"
            />
            <label htmlFor="testActive" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Active (Visible on website)
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md"
          >
            {editingTestimonial ? 'Update Testimonial' : 'Save Testimonial'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
};
