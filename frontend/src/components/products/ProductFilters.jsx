import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { SelectDropdown } from '../common/SelectDropdown';
import { useCurrency } from '../../hooks/useCurrency';

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
  selectedSize,
  onSizeChange,
  selectedFit,
  onFitChange,
  selectedFabric,
  onFabricChange,
  selectedAudience,
  onAudienceChange,
  onClearFilters,
}) => {
  const { currencySymbol, formatMoney } = useCurrency();
  const priceCeiling = 5000;
  const priceStep = 25;
  const minPrice = Math.min(Math.max(Number(priceRange.min) || 0, 0), priceCeiling);
  const maxPrice = Math.max(
    minPrice,
    Math.min(priceRange.max === '' ? priceCeiling : Number(priceRange.max) || priceCeiling, priceCeiling)
  );
  const minPercent = (minPrice / priceCeiling) * 100;
  const maxPercent = (maxPrice / priceCeiling) * 100;

  const updateMinPrice = (nextMin) => {
    const safeMin = Math.min(Number(nextMin), maxPrice);
    onPriceRangeChange({
      ...priceRange,
      min: safeMin === 0 ? '' : String(safeMin),
      max: priceRange.max && safeMin > Number(priceRange.max) ? String(safeMin) : priceRange.max,
    });
  };

  const updateMaxPrice = (nextMax) => {
    const safeMax = Math.max(Number(nextMax), minPrice);
    onPriceRangeChange({
      ...priceRange,
      min: priceRange.min,
      // At the upper limit, omit maxPrice so products above the slider range
      // remain visible until a customer deliberately lowers the maximum.
      max: safeMax >= priceCeiling ? '' : String(safeMax),
    });
  };

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
              className={`w-full min-w-0 text-left text-xs py-1.5 px-2.5 rounded-lg transition font-medium flex items-center justify-between gap-3 [&_.truncate]:!pl-0 [&_.truncate]:before:hidden ${
                selectedCategory === cat.slug
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`truncate ${cat.parent ? 'pl-4 before:mr-2 before:text-slate-300 before:content-[\'↳\']' : ''}`}>{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className={`shrink-0 tabular-nums text-[10px] ${selectedCategory === cat.slug ? 'text-slate-300' : 'text-slate-400'}`}>
                  {cat.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Price Range</h4>
          <span className="text-[10px] font-semibold text-slate-500">{currencySymbol}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
          <span>{formatMoney(minPrice)}</span>
          <span className="text-slate-300">—</span>
          <span>{formatMoney(maxPrice)}{priceRange.max === '' ? '+' : ''}</span>
        </div>
        <div className="pt-1">
          <p className="mb-2 text-[10px] font-medium text-slate-500">Drag the two handles to set your range</p>
          <div className="relative h-6" role="group" aria-label="Price range">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-900"
              style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
            />
            <input
              id="minimum-product-price"
              aria-label="Minimum price"
              type="range"
              min="0"
              max={priceCeiling}
              step={priceStep}
              value={minPrice}
              onChange={(e) => updateMinPrice(e.target.value)}
              className={`price-range-thumb absolute left-0 top-0 z-20 h-6 w-full ${minPrice === maxPrice ? 'z-30' : ''}`}
            />
            <input
              id="maximum-product-price"
              aria-label="Maximum price"
              type="range"
              min="0"
              max={priceCeiling}
              step={priceStep}
              value={maxPrice}
              onChange={(e) => updateMaxPrice(e.target.value)}
              className="price-range-thumb absolute left-0 top-0 z-10 h-6 w-full"
            />
          </div>
        </div>
      </div>

      {/* Stock Availability */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Clothing Details</h4>
        <SelectDropdown
          value={selectedAudience}
          onChange={onAudienceChange}
          options={[
            { value: '', label: 'All departments' },
            { value: 'women', label: 'Women' },
            { value: 'men', label: 'Men' },
            { value: 'girls', label: 'Girls' },
            { value: 'boys', label: 'Boys' },
            { value: 'unisex', label: 'Unisex' },
          ]}
          ariaLabel="Filter by department"
        />
        <SelectDropdown
          value={selectedSize}
          onChange={onSizeChange}
          options={[
            { value: '', label: 'All sizes' },
            ...['XS', 'S', 'M', 'L', 'XL', 'XXL', '26', '28', '30', '32', '34', '36', '38', '40', '5', '6', '7', '8', '9', '10', '11', '12']
              .map((value) => ({ value, label: value })),
          ]}
          ariaLabel="Filter by size"
        />
        <SelectDropdown
          value={selectedFit}
          onChange={onFitChange}
          options={[
            { value: '', label: 'All fits' },
            { value: 'slim', label: 'Slim fit' },
            { value: 'regular', label: 'Regular fit' },
            { value: 'relaxed', label: 'Relaxed fit' },
            { value: 'oversized', label: 'Oversized fit' },
            { value: 'tailored', label: 'Tailored fit' },
          ]}
          ariaLabel="Filter by fit"
        />
        <SelectDropdown
          value={selectedFabric}
          onChange={onFabricChange}
          options={[
            { value: '', label: 'All fabrics' },
            { value: 'Cotton', label: 'Cotton' },
            { value: 'Linen', label: 'Linen' },
            { value: 'Denim', label: 'Denim' },
            { value: 'Silk', label: 'Silk' },
            { value: 'Wool', label: 'Wool' },
            { value: 'Cashmere', label: 'Cashmere' },
          ]}
          ariaLabel="Filter by fabric"
        />
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
