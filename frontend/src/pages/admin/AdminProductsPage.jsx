import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { ImageUpload } from '../../components/common/ImageUpload';
import { SelectDropdown } from '../../components/common/SelectDropdown';
import { MultiSelectDropdown } from '../../components/common/MultiSelectDropdown';
import { useApplicationAlert } from '../../context/ApplicationAlertContext';
import { useCurrency } from '../../hooks/useCurrency';

const SIZE_PRESETS = {
  alpha: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  waist: ['26', '28', '30', '32', '34', '36', '38', '40'],
  shoe: ['5', '6', '7', '8', '9', '10', '11', '12'],
  one_size: ['One Size'],
  custom: [],
};

const COLOUR_OPTIONS = ['Black', 'White', 'Grey', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Purple', 'Brown', 'Beige', 'Camel', 'Navy', 'Olive', 'Orange'];
const FABRIC_OPTIONS = ['Cotton', 'Linen', 'Denim', 'Silk', 'Wool', 'Cashmere', 'Leather', 'Viscose', 'Polyester', 'Nylon'];
const GARMENT_TYPE_OPTIONS = ['T-Shirt', 'Shirt', 'Blouse', 'Dress', 'Skirt', 'Jeans', 'Trousers', 'Shorts', 'Jacket', 'Coat', 'Sweater', 'Hoodie', 'Shoes', 'Bag', 'Accessory'];
const MEASUREMENT_COLUMN_OPTIONS = ['Chest', 'Bust', 'Waist', 'Hip', 'Length', 'Shoulder', 'Sleeve length', 'Inseam', 'Rise', 'Thigh', 'Hem', 'Foot length'];
const SPECIFICATION_OPTIONS = {
  Weave: ['Woven', 'Knit', 'Denim', 'Jersey', 'Twill'],
  Rise: ['Low rise', 'Mid rise', 'High rise'],
  Sleeve: ['Sleeveless', 'Short sleeve', 'Three-quarter sleeve', 'Long sleeve'],
  Sole: ['Rubber', 'Leather', 'EVA', 'TPR'],
  Care: ['Machine wash cold', 'Hand wash only', 'Dry clean only', 'Do not tumble dry'],
  Closure: ['Button', 'Zip', 'Pull-on', 'Tie', 'Hook and eye'],
  Fit: ['Slim', 'Regular', 'Relaxed', 'Oversized'],
  'Country of origin': ['Italy', 'France', 'Portugal', 'Spain', 'Germany', 'United Kingdom', 'Turkey'],
};
const FASHION_OPTIONS = {
  pattern: ['Solid', 'Striped', 'Printed', 'Checked', 'Floral', 'Graphic'],
  occasion: ['Casual', 'Workwear', 'Evening', 'Party', 'Formal', 'Sportswear'],
  neckline: ['Round neck', 'V-neck', 'Collar', 'Crew neck', 'Square neck', 'High neck'],
  sleeveType: ['Sleeveless', 'Short sleeve', 'Three-quarter sleeve', 'Long sleeve'],
  garmentLength: ['Cropped', 'Regular', 'Long', 'Midi', 'Maxi'],
  closure: ['Button', 'Zip', 'Pull-on', 'Tie', 'Hook and eye'],
  transparency: ['Opaque', 'Semi-sheer', 'Sheer'],
  weave: ['Woven', 'Knit', 'Denim', 'Jersey', 'Twill'],
  stretch: ['No stretch', 'Low stretch', 'Medium stretch', 'High stretch'],
  materialComposition: ['100% Cotton', '100% Linen', '100% Wool', '100% Cashmere', '100% Silk', 'Cotton blend', 'Linen blend'],
  careInstructions: ['Machine wash cold', 'Hand wash only', 'Dry clean only', 'Do not tumble dry', 'Wash separately'],
  countryOfOrigin: ['Italy', 'France', 'Portugal', 'Spain', 'Germany', 'United Kingdom', 'India', 'Turkey'],
  modelHeight: ['160 cm', '165 cm', '170 cm', '175 cm', '180 cm', '185 cm'],
  modelWearsSize: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  brandName: [],
};

export const AdminProductsPage = () => {
  const [searchParams] = useSearchParams();
  const productToEditId = searchParams.get('edit') || '';
  const focusedVariantSku = searchParams.get('variantSku') || '';
  const { showAlert, showConfirm } = useApplicationAlert();
  const { currency, currencySymbol, formatMoney, commerce: commerceSettings } = useCurrency();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    category: '',
    sku: '',
    stock: 10,
    sizes: 'XS, S, M, L, XL',
    colors: '',
    variants: [],
    sizeSystem: 'alpha',
    fit: '',
    fabric: '',
    garmentType: '',
    audience: 'all',
    colorOptions: [],
    fashionDetails: {},
    sizeChart: { measurementType: 'body', unit: 'cm', columns: [], rows: [] },
    returnPolicy: { returnable: true, exchangeable: true, returnWindowDays: 30, exchangeWindowDays: 30, finalSale: false, exemptionReason: '', note: '' },
    commerce: { currency: 'EUR', vatRate: 20, vatIncluded: true, weightGrams: 0 },
    specifications: [],
    images: [],
    isFeatured: false,
    isActive: true,
  });
  const [customFashionFields, setCustomFashionFields] = useState([]);
  const [customSizeChartColumns, setCustomSizeChartColumns] = useState(false);
  const [customSpecificationKeys, setCustomSpecificationKeys] = useState([]);
  const [customSpecificationValues, setCustomSpecificationValues] = useState([]);

  // Parent categories are storefront navigation groups. Only categories with
  // no children can receive a product directly.
  const parentCategoryIds = new Set(
    categories
      .map((category) => (typeof category.parent === 'object' ? category.parent?._id : category.parent))
      .filter(Boolean)
      .map(String)
  );
  const productCategories = categories.filter((category) => category.isActive && !parentCategoryIds.has(String(category._id)));

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products/admin?page=${page}&limit=15&search=${encodeURIComponent(search)}${productToEditId ? `&productId=${encodeURIComponent(productToEditId)}` : ''}`),
        api.get('/categories/admin'),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        setTotalPages(prodRes.data.pages || 1);
        const productToOpen = productToEditId
          ? prodRes.data.products.find((product) => product._id === productToEditId)
          : null;
        if (productToOpen) handleOpenEdit(productToOpen);
      }
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, productToEditId]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setCustomFashionFields([]);
    setCustomSizeChartColumns(false);
    setCustomSpecificationKeys([]);
    setCustomSpecificationValues([]);
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: '',
      discountPrice: '',
      category: productCategories[0]?._id || '',
      sku: `AUR-${Date.now().toString().slice(-4)}`,
      stock: 10,
      sizes: 'XS, S, M, L, XL',
      colors: '',
      variants: [],
      sizeSystem: 'alpha',
      fit: '',
      fabric: '',
      garmentType: '',
      audience: productCategories[0]?.audience || 'all',
      colorOptions: [],
      fashionDetails: {},
      sizeChart: { measurementType: 'body', unit: 'cm', columns: [], rows: [] },
      returnPolicy: productCategories[0]?.defaultReturnPolicy || { returnable: true, exchangeable: true, returnWindowDays: 30, exchangeWindowDays: 30, finalSale: false, exemptionReason: '', note: '' },
      commerce: { currency, vatRate: commerceSettings.defaultVatRate ?? 20, vatIncluded: commerceSettings.pricesIncludeVat !== false, weightGrams: 0 },
      specifications: [],
      images: [],
      isFeatured: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setCustomFashionFields(Object.keys(p.fashionDetails || {}).filter((key) =>
      FASHION_OPTIONS[key] && p.fashionDetails?.[key] && !FASHION_OPTIONS[key].includes(p.fashionDetails[key])
    ));
    setCustomSizeChartColumns((p.sizeChart?.columns || []).some((column) => !MEASUREMENT_COLUMN_OPTIONS.includes(column)));
    setCustomSpecificationKeys((p.specifications || []).map((specification, index) =>
      specification.key && !Object.hasOwn(SPECIFICATION_OPTIONS, specification.key) ? index : null
    ).filter((index) => index !== null));
    setCustomSpecificationValues((p.specifications || []).map((specification, index) =>
      SPECIFICATION_OPTIONS[specification.key]?.length && specification.value && !SPECIFICATION_OPTIONS[specification.key].includes(specification.value) ? index : null
    ).filter((index) => index !== null));
    setFormData({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription || '',
      price: p.price,
      discountPrice: p.discountPrice || '',
      category: p.category?._id || p.category,
      sku: p.sku || '',
      stock: p.stock,
      sizes: p.sizes?.join(', ') || 'XS, S, M, L, XL',
      colors: p.colors?.join(', ') || '',
      variants: (p.variants || []).map((variant) => ({
        _id: variant._id,
        sku: variant.sku,
        size: variant.size || '',
        color: variant.color || '',
        stock: variant.stock,
        price: variant.price ?? '',
        discountPrice: variant.discountPrice ?? '',
        images: variant.images || [],
        isActive: variant.isActive !== false,
      })),
      sizeSystem: p.sizeSystem || 'alpha',
      fit: p.fit || '',
      fabric: p.fabric || '',
      garmentType: p.garmentType || '',
      audience: p.audience || 'all',
      colorOptions: p.colorOptions || [],
      fashionDetails: (() => {
        const { manufacturer, packageContents, ...details } = p.fashionDetails || {};
        // Preserve an older manufacturer value as the new customer-facing brand name.
        return { ...details, brandName: details.brandName || manufacturer || '' };
      })(),
      sizeChart: p.sizeChart || { measurementType: 'body', unit: 'cm', columns: [], rows: [] },
      returnPolicy: p.returnPolicy || { returnable: true, exchangeable: true, returnWindowDays: 30, exchangeWindowDays: 30, finalSale: false, exemptionReason: '', note: '' },
      commerce: p.commerce || { currency, vatRate: commerceSettings.defaultVatRate ?? 20, vatIncluded: true, weightGrams: 0 },
      specifications: (p.specifications || []).map((specification) => ({
        key: specification.key,
        value: specification.value,
      })),
      images: p.images || [],
      isFeatured: p.isFeatured,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const activeColorsWithoutImages = [...new Set(
      formData.variants
        .filter((variant) => variant.isActive && variant.color)
        .map((variant) => variant.color)
    )].filter((color) => !formData.variants.some(
      (variant) => variant.isActive && variant.color === color && variant.images?.length
    ));

    if (activeColorsWithoutImages.length > 0) {
      showAlert(`Upload at least one image for: ${activeColorsWithoutImages.join(', ')}.`, {
        title: 'Colour images required',
      });
      return;
    }

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: formData.variants.length
          ? formData.variants.reduce((sum, variant) => sum + (variant.isActive ? Number(variant.stock) || 0 : 0), 0)
          : Number(formData.stock),
        sizes: typeof formData.sizes === 'string'
          ? formData.sizes.split(',').map((s) => s.trim()).filter(Boolean)
          : formData.sizes,
        colors: typeof formData.colors === 'string'
          ? formData.colors.split(',').map((c) => c.trim()).filter(Boolean)
          : formData.colors,
        variants: formData.variants.map((variant) => ({
          ...variant,
          stock: Number(variant.stock) || 0,
          price: variant.price === '' ? null : Number(variant.price),
          discountPrice: variant.discountPrice === '' ? null : Number(variant.discountPrice),
        })),
        images: formData.images,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      await loadData();
      setModalOpen(false);
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error saving product');
    }
  };

  const generateVariants = () => {
    const sizes = formData.sizes.split(',').map((value) => value.trim()).filter(Boolean);
    const colors = formData.colors.split(',').map((value) => value.trim()).filter(Boolean);

    if (sizes.length > 0 && colors.length === 0) {
      showAlert('Add at least one colour option before generating size and colour inventory.', {
        title: 'Colour options required',
      });
      return;
    }

    const sizeOptions = sizes.length ? sizes : [''];
    const colorValues = colors.length ? colors : [''];
    const existingByCombination = new Map(
      formData.variants.map((variant) => [`${variant.color}::${variant.size}`, variant])
    );
    const baseSku = (formData.sku || 'AUR').trim().toUpperCase();
    const variants = [];

    colorValues.forEach((color) => {
      sizeOptions.forEach((size) => {
        const key = `${color}::${size}`;
        const existing = existingByCombination.get(key);
        const suffix = [color, size]
          .filter(Boolean)
          .map((value) => value.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase())
          .join('-');
        variants.push(existing || {
          sku: `${baseSku}${suffix ? `-${suffix}` : '-DEFAULT'}`,
          size,
          color,
          stock: 0,
          price: '',
          discountPrice: '',
          images: [],
          isActive: true,
        });
      });
    });

    const existingColorOptions = new Map((formData.colorOptions || []).map((option) => [option.name, option]));
    const colorOptions = colors.map((name) => existingColorOptions.get(name) || { name, hex: '#CBD5E1', swatchImage: '' });
    setFormData({ ...formData, variants, colorOptions });
  };

  const toggleVariantAvailability = (size, color) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.size === size && variant.color === color
          ? { ...variant, isActive: !variant.isActive }
          : variant
      ),
    }));
  };

  const updateVariant = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const setColorGalleryImages = (color, images) => {
    setFormData((current) => {
      const nextImages = [...new Set(images.filter(Boolean))];
      return {
        ...current,
        // Keep colour images in the main gallery as well so product cards and
        // legacy views always have a reliable fallback image.
        images: [...new Set([...current.images, ...nextImages])],
        variants: current.variants.map((variant) =>
          variant.color === color ? { ...variant, images: nextImages } : variant
        ),
      };
    });
  };

  const removeVariant = (index) => {
    setFormData((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      specifications: current.specifications.map((specification, specificationIndex) =>
        specificationIndex === index ? { ...specification, [field]: value } : specification
      ),
    }));
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'This product and its catalog information will be permanently removed.',
      { title: 'Delete Product?', confirmLabel: 'Delete Product' }
    );
    if (confirmed) {
      try {
        await api.delete(`/products/${id}`);
        await loadData();
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/products/${id}/toggle-status`);
      await loadData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <AdminLayout title="Product Catalog Management">
      <div className="space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <button
            onClick={handleOpenAdd}
            className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Stock</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Featured</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.images?.[0] || '/image-placeholder.svg'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-900">{formatMoney(p.price)}</span>
                      {p.discountPrice && (
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          Disc: {formatMoney(p.discountPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`font-black px-2 py-0.5 rounded text-[11px] ${
                          p.stock <= 5
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      {p.isFeatured ? (
                        <span className="flex items-center text-amber-600 font-bold text-[10px]">
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Masterwork' : 'New Masterwork'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Category *
              </label>
              <SelectDropdown
                value={formData.category}
                onChange={(category) => {
                  const selectedCategory = categories.find((entry) => entry._id === category);
                  setFormData({
                    ...formData,
                    category,
                    sizeSystem: selectedCategory?.defaultSizeSystem || formData.sizeSystem,
                    sizes: selectedCategory?.defaultSizes?.length
                      ? selectedCategory.defaultSizes.join(', ')
                      : formData.sizes,
                    audience: selectedCategory?.audience || formData.audience,
                    returnPolicy: selectedCategory?.defaultReturnPolicy || formData.returnPolicy,
                  });
                }}
                options={productCategories.map((category) => ({
                  value: category._id,
                  label: category.name,
                }))}
                placeholder="Select a category"
                ariaLabel="Product category"
                required
                disabled={!productCategories.length}
              />
              <p className="mt-1 text-[9px] text-slate-500">Only final subcategories can contain products. Parent categories are used for storefront browsing.</p>
            </div>
          </div>

          {formData.colorOptions.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Colour Swatches</h3>
              <p className="mt-1 text-[10px] text-slate-500">Choose the customer-facing colour for each named option.</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {formData.colorOptions.map((option, index) => (
                  <div key={option.name} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <input type="color" value={option.hex || '#CBD5E1'} onChange={(e) => setFormData({ ...formData, colorOptions: formData.colorOptions.map((entry, entryIndex) => entryIndex === index ? { ...entry, hex: e.target.value } : entry) })} className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent" />
                    <span className="min-w-0 truncate text-xs font-bold text-slate-800">{option.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Size System</label>
              <SelectDropdown
                value={formData.sizeSystem}
                onChange={(sizeSystem) => setFormData({
                  ...formData,
                  sizeSystem,
                  sizes: sizeSystem === 'custom' ? formData.sizes : SIZE_PRESETS[sizeSystem].join(', '),
                })}
                options={[
                  { value: 'alpha', label: 'Clothing (XS–XXL)' },
                  { value: 'waist', label: 'Waist / Jeans' },
                  { value: 'shoe', label: 'Footwear' },
                  { value: 'one_size', label: 'One Size' },
                  { value: 'custom', label: 'Custom Sizes' },
                ]}
                ariaLabel="Product size system"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Fit</label>
              <SelectDropdown
                value={formData.fit}
                onChange={(fit) => setFormData({ ...formData, fit })}
                options={[
                  { value: '', label: 'Not specified' },
                  { value: 'slim', label: 'Slim' },
                  { value: 'regular', label: 'Regular' },
                  { value: 'relaxed', label: 'Relaxed' },
                  { value: 'oversized', label: 'Oversized' },
                  { value: 'tailored', label: 'Tailored' },
                ]}
                ariaLabel="Product fit"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Fabric</label>
              <SelectDropdown
                value={formData.fabric}
                onChange={(fabric) => setFormData({ ...formData, fabric })}
                options={[{ value: '', label: 'Select fabric' }, ...FABRIC_OPTIONS.map((value) => ({ value, label: value }))]}
                ariaLabel="Product fabric"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">Garment Type</label>
              <SelectDropdown
                value={formData.garmentType}
                onChange={(garmentType) => setFormData({ ...formData, garmentType })}
                options={[{ value: '', label: 'Select garment type' }, ...GARMENT_TYPE_OPTIONS.map((value) => ({ value, label: value }))]}
                ariaLabel="Product garment type"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Base SKU *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Regular Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Discount Price ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Inventory Units *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={formData.variants.length > 0}
                value={formData.variants.length
                  ? formData.variants.reduce((sum, variant) => sum + (variant.isActive ? Number(variant.stock) || 0 : 0), 0)
                  : formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:bg-slate-100 disabled:text-slate-500"
              />
              {formData.variants.length > 0 && (
                <p className="text-[9px] text-slate-400 mt-1">Automatically calculated from active variants.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Sizes
              </label>
              {formData.sizeSystem === 'custom' ? (
                <input type="text" value={formData.sizes} placeholder="Enter custom sizes, separated by commas" onChange={(e) => setFormData({ ...formData, sizes: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              ) : (
                <MultiSelectDropdown
                  value={formData.sizes.split(',').map((value) => value.trim()).filter(Boolean)}
                  onChange={(sizes) => setFormData({ ...formData, sizes: sizes.join(', ') })}
                  options={SIZE_PRESETS[formData.sizeSystem] || []}
                  placeholder="Select sizes"
                  ariaLabel="Product sizes"
                />
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
                Colour Options
              </label>
              <MultiSelectDropdown
                value={formData.colors.split(',').map((value) => value.trim()).filter(Boolean)}
                onChange={(colors) => setFormData({ ...formData, colors: colors.join(', ') })}
                options={COLOUR_OPTIONS}
                placeholder="Select colours"
                ariaLabel="Product colours"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Size and Colour Inventory</h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Generate every size-colour combination, then set its SKU and available stock.
                </p>
              </div>
              <button
                type="button"
                onClick={generateVariants}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-800 hover:border-slate-900 transition"
              >
                {formData.variants.length ? 'Refresh Combinations' : 'Generate Variants'}
              </button>
            </div>

            {formData.variants.length > 0 ? (
              <div className="space-y-4">
                {[...new Set(formData.variants.map((variant) => variant.color).filter(Boolean))].length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                        Available colours by size
                      </h4>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Select only the colours customers can purchase in each size. Stock and SKU remain separate for every selection.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[...new Set(formData.variants.map((variant) => variant.size || 'One Size'))].map((sizeLabel) => {
                        const sizeVariants = formData.variants.filter(
                          (variant) => (variant.size || 'One Size') === sizeLabel
                        );
                        return (
                          <div
                            key={sizeLabel}
                            className="grid gap-2 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 md:grid-cols-[100px_minmax(0,1fr)] md:items-start"
                          >
                            <span className="pt-2 text-xs font-bold text-slate-900">{sizeLabel}</span>
                            <div className="flex min-w-0 flex-wrap gap-2">
                              {sizeVariants.map((variant) => (
                                <label
                                  key={`${variant.size}-${variant.color}`}
                                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-[10px] font-bold transition sm:w-[145px] ${
                                    variant.isActive
                                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={variant.isActive}
                                    onChange={() => toggleVariantAvailability(variant.size, variant.color)}
                                    className="sr-only"
                                  />
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full border ${
                                      variant.isActive ? 'border-white bg-amber-400' : 'border-slate-300 bg-slate-100'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="min-w-0 flex-1 truncate" title={variant.color}>
                                    {variant.color}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[900px] text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Colour</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Variant SKU</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Price Override</th>
                      <th className="px-3 py-2">Sale Price</th>
                      <th className="px-3 py-2">Active</th>
                      <th className="px-3 py-2" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.variants.map((variant, index) => (
                      <tr
                        key={`${variant.color}-${variant.size}-${index}`}
                        className={[
                          variant.isActive ? '' : 'bg-slate-50 opacity-60',
                          variant.sku === focusedVariantSku ? 'bg-orange-50 ring-1 ring-inset ring-orange-300' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <td className="px-3 py-2 font-semibold text-slate-700">{variant.color || 'Default'}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{variant.size || 'One size'}</td>
                        <td className="px-3 py-2">
                          <input
                            required
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())}
                            className="w-40 p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono uppercase"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            required
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                            className="w-20 p-2 rounded-lg border border-slate-200 bg-slate-50"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price}
                            placeholder={`Base ${currencySymbol}${formData.price || '0'}`}
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            className="w-28 p-2 rounded-lg border border-slate-200 bg-slate-50"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.discountPrice}
                            placeholder="Optional"
                            onChange={(e) => updateVariant(index, 'discountPrice', e.target.value)}
                            className="w-24 p-2 rounded-lg border border-slate-200 bg-slate-50"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(e) => updateVariant(index, 'isActive', e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            aria-label={`Remove ${variant.color} ${variant.size} variant`}
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
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-[10px] text-slate-500">
                No variant inventory yet. Products without variants continue using the single inventory count above.
              </p>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Short Summary Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Fashion Details</h3>
              <p className="mt-1 text-[10px] text-slate-500">Structured information used on the product page and future catalog filters.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['pattern', 'Pattern'], ['occasion', 'Occasion'], ['neckline', 'Neckline'], ['sleeveType', 'Sleeve type'],
                ['garmentLength', 'Garment length'], ['closure', 'Closure'], ['transparency', 'Transparency'], ['weave', 'Weave'],
                ['stretch', 'Stretch'], ['materialComposition', 'Material composition'], ['careInstructions', 'Care instructions'], ['countryOfOrigin', 'Country of origin'],
                ['modelHeight', 'Model height'], ['modelWearsSize', 'Model wears size'], ['brandName', 'Brand name'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-[9px] uppercase font-bold text-slate-600 block mb-1">{label}</label>
                  {FASHION_OPTIONS[key] ? (
                    <div>
                      {customFashionFields.includes(key) ? (
                        <div className="relative">
                          <input
                            autoFocus
                            value={formData.fashionDetails?.[key] || ''}
                            onChange={(e) => setFormData({ ...formData, fashionDetails: { ...formData.fashionDetails, [key]: e.target.value } })}
                            placeholder={`Enter custom ${label.toLowerCase()}`}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-20 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomFashionFields((current) => current.filter((entry) => entry !== key));
                              setFormData({ ...formData, fashionDetails: { ...formData.fashionDetails, [key]: '' } });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-900"
                          >
                            Use list
                          </button>
                        </div>
                      ) : (
                      <SelectDropdown
                        value={formData.fashionDetails?.[key] || ''}
                        onChange={(value) => {
                          const isCustom = value === '__custom__';
                          setCustomFashionFields((current) => isCustom
                            ? [...new Set([...current, key])]
                            : current.filter((entry) => entry !== key));
                          setFormData({ ...formData, fashionDetails: { ...formData.fashionDetails, [key]: isCustom ? '' : value } });
                        }}
                        options={[
                          { value: '', label: `Select ${label.toLowerCase()}` },
                          ...FASHION_OPTIONS[key].map((value) => ({ value, label: value })),
                          { value: '__custom__', label: 'Custom / Other' },
                        ]}
                        ariaLabel={label}
                      />
                      )}
                    </div>
                  ) : (
                    <input value={formData.fashionDetails?.[key] || ''} onChange={(e) => setFormData({ ...formData, fashionDetails: { ...formData.fashionDetails, [key]: e.target.value } })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product Size Chart</h3>
                <p className="mt-1 text-[10px] text-slate-500">Enter measurements per size. Customers can switch between centimetres and inches.</p>
              </div>
              <div className="flex gap-2">
                <SelectDropdown value={formData.sizeChart?.measurementType || 'body'} onChange={(measurementType) => setFormData({ ...formData, sizeChart: { ...formData.sizeChart, measurementType } })} options={[{ value: 'body', label: 'Body measurements' }, { value: 'garment', label: 'Garment measurements' }]} ariaLabel="Measurement type" />
                <SelectDropdown value={formData.sizeChart?.unit || 'cm'} onChange={(unit) => setFormData({ ...formData, sizeChart: { ...formData.sizeChart, unit } })} options={[{ value: 'cm', label: 'Centimetres' }, { value: 'in', label: 'Inches' }]} ariaLabel="Measurement unit" />
              </div>
            </div>
            {customSizeChartColumns ? (
              <div className="relative">
                <input value={(formData.sizeChart?.columns || []).join(', ')} onChange={(e) => setFormData({ ...formData, sizeChart: { ...formData.sizeChart, columns: e.target.value.split(',').map((value) => value.trim()).filter(Boolean) } })} placeholder="Enter custom columns, separated by commas" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-20 text-xs" />
                <button type="button" onClick={() => { setCustomSizeChartColumns(false); setFormData({ ...formData, sizeChart: { ...formData.sizeChart, columns: [] } }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-900">Use list</button>
              </div>
            ) : (
              <MultiSelectDropdown
                value={formData.sizeChart?.columns || []}
                onChange={(columns) => {
                  if (columns.includes('__custom_columns__')) {
                    setCustomSizeChartColumns(true);
                    setFormData({ ...formData, sizeChart: { ...formData.sizeChart, columns: [] } });
                    return;
                  }
                  setFormData({ ...formData, sizeChart: { ...formData.sizeChart, columns } });
                }}
                options={[...MEASUREMENT_COLUMN_OPTIONS, '__custom_columns__']}
                placeholder="Select measurement columns"
                ariaLabel="Measurement columns"
              />
            )}
            <button type="button" onClick={() => {
              const sizes = formData.sizes.split(',').map((value) => value.trim()).filter(Boolean);
              const existingRows = new Map((formData.sizeChart?.rows || []).map((row) => [row.size, row]));
              setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows: sizes.map((size) => existingRows.get(size) || { size, measurements: [] }) } });
            }} className="rounded-xl border border-slate-300 px-4 py-2 text-[10px] font-bold uppercase">Build Measurement Rows</button>
            {(formData.sizeChart?.rows || []).map((row, rowIndex) => (
              <div key={row.size} className="grid gap-2 rounded-xl bg-slate-50 p-3" style={{ gridTemplateColumns: `80px repeat(${Math.max(1, formData.sizeChart.columns?.length || 1)}, minmax(90px, 1fr))` }}>
                <span className="self-center text-xs font-bold">{row.size}</span>
                {(formData.sizeChart.columns || []).map((column) => {
                  const measurement = row.measurements?.find((entry) => entry.key === column);
                  return <input key={column} type="number" min="0" step="0.1" value={measurement?.value ?? ''} placeholder={column} onChange={(e) => setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows: formData.sizeChart.rows.map((entry, entryIndex) => entryIndex === rowIndex ? { ...entry, measurements: [...(entry.measurements || []).filter((item) => item.key !== column), { key: column, value: Number(e.target.value) }] } : entry) } })} className="rounded-lg border border-slate-200 bg-white p-2 text-xs" />;
                })}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product Return Eligibility</h3>
            <div className="flex flex-wrap gap-5 text-xs font-semibold">
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.returnPolicy.returnable} onChange={(e) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, returnable: e.target.checked } })} /> Returnable</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.returnPolicy.exchangeable} onChange={(e) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, exchangeable: e.target.checked } })} /> Exchangeable</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.returnPolicy.finalSale} onChange={(e) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, finalSale: e.target.checked, returnable: e.target.checked ? false : formData.returnPolicy.returnable, exemptionReason: e.target.checked ? formData.returnPolicy.exemptionReason : '' } })} /> Return-rights exemption</label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectDropdown
                value={String(formData.returnPolicy.returnWindowDays ?? 30)}
                onChange={(returnWindowDays) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, returnWindowDays: Number(returnWindowDays) } })}
                options={[
                  { value: '14', label: 'Return window: 14 days' },
                  { value: '30', label: 'Return window: 30 days' },
                  { value: '60', label: 'Return window: 60 days' },
                ]}
                ariaLabel="Return window days"
              />
              <SelectDropdown
                value={String(formData.returnPolicy.exchangeWindowDays ?? 30)}
                onChange={(exchangeWindowDays) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, exchangeWindowDays: Number(exchangeWindowDays) } })}
                options={[
                  { value: '7', label: 'Exchange window: 7 days' },
                  { value: '14', label: 'Exchange window: 14 days' },
                  { value: '30', label: 'Exchange window: 30 days' },
                ]}
                ariaLabel="Exchange window days"
              />
              <input value={formData.returnPolicy.note || ''} onChange={(e) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, note: e.target.value } })} placeholder="Policy note" className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs" />
            </div>
            {formData.returnPolicy.finalSale && (
              <div>
                <p className="mb-2 text-[10px] text-amber-700">European distance-selling rights permit exclusions only in specific cases. A discounted item alone is not final sale.</p>
                <SelectDropdown
                  value={formData.returnPolicy.exemptionReason || ''}
                  onChange={(value) => setFormData({ ...formData, returnPolicy: { ...formData.returnPolicy, exemptionReason: value } })}
                  options={[
                    { value: '', label: 'Select legal exemption' },
                    { value: 'personalised', label: 'Made to measure / personalised' },
                    { value: 'sealed_hygiene', label: 'Sealed hygiene item' },
                    { value: 'sealed_opened', label: 'Sealed item once opened' },
                    { value: 'perishable', label: 'Perishable goods' },
                    { value: 'digital_content', label: 'Digital content supplied' },
                  ]}
                  ariaLabel="Return rights exemption"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-700 block mb-1">
              Full Description *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product-specific attributes</h3>
                <p className="text-[10px] text-slate-500 mt-1">Add details such as weave, rise, sleeve, sole, care, or closure.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  specifications: [...formData.specifications, { key: '', value: '' }],
                })}
                className="px-3 py-2 rounded-lg border border-slate-300 text-[10px] font-bold uppercase hover:border-slate-900"
              >
                Add Attribute
              </button>
            </div>
            {formData.specifications.map((specification, index) => {
              const customKey = customSpecificationKeys.includes(index);
              const valueOptions = SPECIFICATION_OPTIONS[specification.key] || [];
              const customValue = customSpecificationValues.includes(index) || (!customKey && specification.value && !valueOptions.includes(specification.value));
              return (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                {customKey ? (
                  <div className="relative"><input required value={specification.key} onChange={(e) => updateSpecification(index, 'key', e.target.value)} placeholder="Enter custom attribute" className="w-full p-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-xs" /><button type="button" onClick={() => { setCustomSpecificationKeys((items) => items.filter((item) => item !== index)); updateSpecification(index, 'key', ''); updateSpecification(index, 'value', ''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">Use list</button></div>
                ) : (
                  <SelectDropdown value={specification.key} onChange={(key) => { if (key === '__custom__') { setCustomSpecificationKeys((items) => [...new Set([...items, index])]); updateSpecification(index, 'key', ''); } else { setCustomSpecificationValues((items) => items.filter((item) => item !== index)); updateSpecification(index, 'key', key); updateSpecification(index, 'value', ''); } }} options={[{ value: '', label: 'Select attribute' }, ...Object.keys(SPECIFICATION_OPTIONS).map((key) => ({ value: key, label: key })), { value: '__custom__', label: 'Custom / Other' }]} ariaLabel="Product attribute" />
                )}
                {customKey || customValue || !specification.key ? (
                  <div className="relative"><input required value={specification.value} onChange={(e) => updateSpecification(index, 'value', e.target.value)} placeholder="Enter custom value" className="w-full p-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-xs" />{!customKey && <button type="button" onClick={() => { setCustomSpecificationValues((items) => items.filter((item) => item !== index)); updateSpecification(index, 'value', ''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">Use list</button>}</div>
                ) : (
                  <SelectDropdown value={specification.value} onChange={(value) => { if (value === '__custom__') { setCustomSpecificationValues((items) => [...new Set([...items, index])]); updateSpecification(index, 'value', ''); } else updateSpecification(index, 'value', value); }} options={[{ value: '', label: 'Select value' }, ...valueOptions.map((value) => ({ value, label: value })), { value: '__custom__', label: 'Custom / Other' }]} ariaLabel={`${specification.key} value`} />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, specifications: formData.specifications.filter((_, specificationIndex) => specificationIndex !== index) });
                    setCustomSpecificationKeys((items) => items.filter((item) => item !== index).map((item) => item > index ? item - 1 : item));
                    setCustomSpecificationValues((items) => items.filter((item) => item !== index).map((item) => item > index ? item - 1 : item));
                  }}
                  className="p-2.5 text-slate-400 hover:text-rose-600"
                  aria-label="Remove product attribute"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              );
            })}
          </div> */}

          <ImageUpload
            label="Product Gallery"
            value={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
            purpose="products"
            multiple
            maxFiles={8}
            required
            aspectClass="aspect-square"
          />

          {formData.variants.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Colour-specific galleries</h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  Upload the correct photos for every colour. The customer gallery changes automatically when that colour is selected.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[...new Set(
                  formData.variants
                    .filter((variant) => variant.isActive && variant.color)
                    .map((variant) => variant.color)
                )].map((color) => {
                  const colorImages = [...new Set(
                    formData.variants
                      .filter((variant) => variant.color === color)
                      .flatMap((variant) => variant.images || [])
                      .filter(Boolean)
                  )];

                  return (
                    <div key={color} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <ImageUpload
                        label={`${color} gallery`}
                        value={colorImages}
                        onChange={(images) => setColorGalleryImages(color, images)}
                        purpose="products"
                        multiple
                        maxFiles={6}
                        required
                        aspectClass="aspect-square"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="font-semibold text-slate-800">Featured on Homepage</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900"
              />
              <span className="font-semibold text-slate-800">Active (Visible to public)</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-md"
          >
            {editingProduct ? 'Save Changes' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
};
