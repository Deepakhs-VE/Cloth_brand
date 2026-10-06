import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

export const ProductFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  selectedRating,
  onRatingChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Filters</h3>
        </div>
        <button
          onClick={onClearFilters}
          className="text-xs text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-medium transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Categories</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition font-medium ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition font-medium flex items-center justify-between ${
                selectedCategory === cat.slug
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className={`text-[10px] ${selectedCategory === cat.slug ? 'text-slate-300' : 'text-slate-400'}`}>
                  {cat.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Price Range ($)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min ($)</label>
            <input
              type="number"
              placeholder="0"
              value={priceRange.min}
              onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Max ($)</label>
            <input
              type="number"
              placeholder="1000"
              value={priceRange.max}
              onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Stock Availability */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center space-x-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
          />
          <span className="text-xs font-medium text-slate-700">In Stock Only</span>
        </label>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Minimum Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => onRatingChange(selectedRating === r ? '' : r)}
              className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition flex items-center justify-between ${
                selectedRating === r ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{r} Stars & Above</span>
              {selectedRating === r && <span className="text-amber-600 text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
