import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

export const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-slate-200 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-600 mb-2">
              Curated Disciplines
            </p>
            <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="mt-4 md:mt-0 text-xs uppercase tracking-widest font-bold text-slate-800 hover:text-amber-700 flex items-center space-x-1 group transition"
          >
            <span>View All Categories</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="motion-card group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 block"
            >
              <img
                src={cat.image || '/image-placeholder.svg'}
                alt={cat.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent group-hover:from-slate-950/90 transition-colors" />

              <div className="absolute inset-x-4 bottom-5 text-white">
                <span className="text-[10px] font-medium tracking-wider text-amber-300 uppercase block mb-1">
                  {cat.productCount || 0} Creations
                </span>
                <h3 className="font-luxury text-base font-bold tracking-wide leading-snug group-hover:text-amber-200 transition-colors">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
