import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    audience: {
      type: String,
      enum: ['all', 'women', 'men', 'girls', 'boys', 'unisex'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    defaultSizeSystem: {
      type: String,
      enum: ['alpha', 'waist', 'shoe', 'one_size', 'custom'],
      default: 'alpha',
    },
    defaultSizes: {
      type: [String],
      default: [],
    },
    attributeDefinitions: {
      type: [
        {
          key: { type: String, required: true, trim: true },
          label: { type: String, required: true, trim: true },
          options: { type: [String], default: [] },
          isFilterable: { type: Boolean, default: true },
          isRequired: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    defaultReturnPolicy: {
      returnable: { type: Boolean, default: true },
      exchangeable: { type: Boolean, default: true },
      returnWindowDays: { type: Number, min: 0, default: 30 },
      exchangeWindowDays: { type: Number, min: 0, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ isActive: 1 });
categorySchema.index({ parent: 1, displayOrder: 1 });
categorySchema.index({ audience: 1, isActive: 1 });

export const Category = mongoose.model('Category', categorySchema);
