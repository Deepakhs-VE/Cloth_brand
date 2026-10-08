import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import api from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFilters } from '../components/products/ProductFilters';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { SelectDropdown } from '../components/common/SelectDropdown';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const isFeaturedParam = searchParams.get('isFeatured') === 'true';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Synchronize category if url param changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Fetch Categories for sidebar
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchParam) params.append('search', searchParam);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (inStockOnly) params.append('inStock', 'true');
      if (selectedRating) params.append('rating', selectedRating);
      if (isFeaturedParam) params.append('isFeatured', 'true');
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchParam, isFeaturedParam, priceRange, inStockOnly, selectedRating, sortBy, page]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
    setSelectedRating('');
    setSortBy('newest');
    setSearchParams({});
    setPage(1);
  };

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    setPage(1);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="bg-[#fcfbfa] min-h-screen py-12">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="font-luxury text-3xl sm:text-4xl font-extrabold text-slate-900">
              {searchParam
                ? `Search results for "${searchParam}"`
                : selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)?.name || 'Curated Collection'
                : 'The Complete Collection'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing {products.length} of {totalCount} authentic pieces
            </p>
          </div>

          {/* Sort & Mobile Filter Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-slate-200 rounded-xl text-xs shadow-sm">
              <span className="text-slate-400 font-medium">Sort by:</span>
              <SelectDropdown
                value={sortBy}
                onChange={(nextSort) => {
                  setSortBy(nextSort);
                  setPage(1);
                }}
                options={[
                  { value: 'newest', label: 'Newest Arrivals' },
                  { value: 'featured', label: 'Featured First' },
                  { value: 'price_asc', label: 'Price: Low to High' },
                  { value: 'price_desc', label: 'Price: High to Low' },
                  { value: 'rating', label: 'Top Rated' },
                ]}
                ariaLabel="Sort products"
                className="min-w-[170px]"
                buttonClassName="min-h-0 border-0 p-0 shadow-none hover:border-0 focus:shadow-none"
                menuClassName="right-0 w-56"
              />
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28">
              <ProductFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={(nextRange) => {
                  setPriceRange(nextRange);
                  setPage(1);
                }}
                inStockOnly={inStockOnly}
                onInStockChange={(nextValue) => {
                  setInStockOnly(nextValue);
                  setPage(1);
                }}
                selectedRating={selectedRating}
                onRatingChange={(nextRating) => {
                  setSelectedRating(nextRating);
                  setPage(1);
                }}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Mobile Filter Sheet */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex justify-end">
              <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900">Filters</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    ✕
                  </button>
                </div>
                <ProductFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(slug) => {
                    handleCategoryChange(slug);
                    setMobileFilterOpen(false);
                  }}
                  priceRange={priceRange}
                  onPriceRangeChange={(nextRange) => {
                    setPriceRange(nextRange);
                    setPage(1);
                  }}
                  inStockOnly={inStockOnly}
                  onInStockChange={(nextValue) => {
                    setInStockOnly(nextValue);
                    setPage(1);
                  }}
                  selectedRating={selectedRating}
                  onRatingChange={(nextRating) => {
                    setSelectedRating(nextRating);
                    setPage(1);
                  }}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </>
            ) : (
              <EmptyState
                icon={PackageOpen}
                title="No items found"
                description="We couldn't find any creations matching your current filter criteria."
                actionText="Reset All Filters"
                onAction={handleClearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
