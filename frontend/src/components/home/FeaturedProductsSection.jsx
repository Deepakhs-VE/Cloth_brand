import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { ProductCard } from '../common/ProductCard';

export const FeaturedProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products/featured');
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 text-xs uppercase font-bold tracking-widest text-amber-600 mb-2 bg-amber-50 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masterwork Highlights</span>
          </div>
          <h2 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Featured Creations
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Meticulously engineered and hand-inspected objects crafted with noble materials to redefine daily distinction.
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            to="/products"
            className="pressable inline-flex items-center space-x-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition shadow-md"
          >
            <span>Explore All Masterworks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
