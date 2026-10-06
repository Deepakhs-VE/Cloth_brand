import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, EyeOff, Trash2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StarRating } from '../../components/common/StarRating';

export const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/admin/all');
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleModerate = async (review) => {
    try {
      await api.patch(`/reviews/admin/${review._id}/moderate`, {
        isApproved: !review.isApproved,
      });
      await loadReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating review');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this review permanently?')) {
      try {
        await api.delete(`/reviews/admin/${id}`);
        await loadReviews();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting review');
      }
    }
  };

  return (
    <AdminLayout title="Product Review Moderation">
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Moderate customer product impressions before or after public publication
          </p>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
            {reviews.length} Reviews Total
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-4">Patron</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-6">Comment</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {rev.product?.name || 'Archived Product'}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{rev.user?.name || 'Patron'}</p>
                      <p className="text-[10px] text-slate-400">{rev.user?.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StarRating rating={rev.rating} size="w-3 h-3" />
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      "{rev.comment}"
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rev.isApproved
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {rev.isApproved ? 'Public' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleModerate(rev)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition ${
                          rev.isApproved
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {rev.isApproved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDelete(rev._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
