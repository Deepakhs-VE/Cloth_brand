import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    size: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, default: null, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    basePrice: { type: Number, default: null, min: 0 },
    baseDiscountPrice: { type: Number, default: null, min: 0 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null, index: true },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    shortDescription: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Product must have at least one image',
      },
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    basePrice: { type: Number, default: null, min: 0 },
    baseDiscountPrice: { type: Number, default: null, min: 0 },
    baseCurrency: { type: String, default: 'EUR', uppercase: true, trim: true },
    pricingVersion: { type: Number, default: 1 },
    discountPrice: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          return v === null || v === undefined || v < this.price;
        },
        message: 'Discount price must be less than regular price',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sizes: {
      type: [String],
      default: ['XS', 'S', 'M', 'L', 'XL'],
    },
    colors: {
      type: [String],
      default: [],
    },
    colorOptions: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          hex: { type: String, default: '#CBD5E1', trim: true },
          swatchImage: { type: String, default: '' },
        },
      ],
      default: [],
    },
    variants: {
      type: [productVariantSchema],
      default: [],
    },
    sizeSystem: {
      type: String,
      enum: ['alpha', 'waist', 'shoe', 'one_size', 'custom'],
      default: 'alpha',
    },
    fit: {
      type: String,
      enum: ['', 'slim', 'regular', 'relaxed', 'oversized', 'tailored'],
      default: '',
    },
    fabric: {
      type: String,
      trim: true,
      default: '',
    },
    garmentType: {
      type: String,
      trim: true,
      default: '',
    },
    audience: {
      type: String,
      enum: ['all', 'women', 'men', 'girls', 'boys', 'unisex'],
      default: 'all',
    },
    fashionDetails: {
      pattern: { type: String, default: '', trim: true },
      occasion: { type: String, default: '', trim: true },
      neckline: { type: String, default: '', trim: true },
      sleeveType: { type: String, default: '', trim: true },
      garmentLength: { type: String, default: '', trim: true },
      closure: { type: String, default: '', trim: true },
      transparency: { type: String, default: '', trim: true },
      weave: { type: String, default: '', trim: true },
      stretch: { type: String, default: '', trim: true },
      materialComposition: { type: String, default: '', trim: true },
      careInstructions: { type: String, default: '', trim: true },
      modelHeight: { type: String, default: '', trim: true },
      modelWearsSize: { type: String, default: '', trim: true },
      countryOfOrigin: { type: String, default: '', trim: true },
      brandName: { type: String, default: '', trim: true },
    },
    sizeChart: {
      measurementType: { type: String, enum: ['body', 'garment'], default: 'body' },
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
      columns: { type: [String], default: [] },
      rows: {
        type: [
          {
            size: { type: String, required: true, trim: true },
            measurements: {
              type: [{ key: { type: String, required: true }, value: { type: Number, required: true, min: 0 } }],
              default: [],
            },
          },
        ],
        default: [],
      },
    },
    returnPolicy: {
      returnable: { type: Boolean, default: true },
      exchangeable: { type: Boolean, default: true },
      returnWindowDays: { type: Number, min: 0, default: 30 },
      exchangeWindowDays: { type: Number, min: 0, default: 30 },
      finalSale: { type: Boolean, default: false },
    exemptionReason: {
      type: String,
      enum: ['', 'personalised', 'sealed_hygiene', 'sealed_opened', 'perishable', 'digital_content'],
      default: '',
    },
      note: { type: String, default: '', trim: true, maxlength: 500 },
    },
    commerce: {
      currency: { type: String, default: 'EUR', uppercase: true, trim: true },
      vatRate: { type: Number, min: 0, max: 100, default: 20 },
      vatIncluded: { type: Boolean, default: true },
      weightGrams: { type: Number, min: 0, default: 0 },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, 'Number of reviews cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('validate', function syncVariantInventory(next) {
  if (!this.variants?.length) return next();

  const combinations = new Set();
  const skus = new Set();
  for (const variant of this.variants) {
    const combination = `${variant.color.trim().toLowerCase()}::${variant.size.trim().toLowerCase()}`;
    const sku = variant.sku.trim().toUpperCase();
    if (this.sku && sku === this.sku.trim().toUpperCase()) {
      return next(new Error(`Variant SKU must be different from the base product SKU (${sku})`));
    }
    if (combinations.has(combination)) {
      return next(new Error(`Duplicate product variant: ${variant.color || 'Default'} / ${variant.size || 'Default'}`));
    }
    if (skus.has(sku)) return next(new Error(`Duplicate variant SKU: ${sku}`));
    if (variant.discountPrice !== null && variant.discountPrice !== undefined) {
      const regularPrice = variant.price ?? this.price;
      if (variant.discountPrice >= regularPrice) {
        return next(new Error(`Variant discount price must be lower than its regular price (${sku})`));
      }
    }
    combinations.add(combination);
    skus.add(sku);
  }

  this.sizes = [...new Set(this.variants.map((variant) => variant.size).filter(Boolean))];
  this.colors = [...new Set(this.variants.map((variant) => variant.color).filter(Boolean))];
  this.stock = this.variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + variant.stock, 0);
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ audience: 1, category: 1, isActive: 1 });

export const Product = mongoose.model('Product', productSchema);
