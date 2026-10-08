import React, { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import api from '../../services/api';
import { StarRating } from '../common/StarRating';

export const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/testimonials');
        if (res.data.success) {
          setTestimonials(res.data.testimonials);
        }
      } catch (err) {
        console.error('Error fetching testimonials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <section className="py-24 bg-slate-50/70 border-t border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-2">
            Discerning Voices
          </p>
          <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Client Impressions
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Read authentic impressions from collectors, designers, and patrons across the globe.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item._id}
              className="motion-card bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <Quote className="w-8 h-8 text-amber-500/30 mb-4" />
                <div className="mb-4">
                  <StarRating rating={item.rating || 5} size="w-4 h-4" />
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic mb-6">
                  "{item.reviewText}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-slate-50">
                <img
                  src={item.avatar || '/image-placeholder.svg'}
                  alt={item.clientName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-100"
                />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.clientName}</h4>
                  <p className="text-xs text-slate-400">{item.roleOrCompany}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
