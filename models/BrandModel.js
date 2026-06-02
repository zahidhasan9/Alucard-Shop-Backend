import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    logo: {
      type: String,
      trim: true,
      default: '',
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    metaTitle: {
      type: String,
      trim: true,
      default: '',
    },

    metaDescription: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

brandSchema.index({ name: 'text', description: 'text', slug: 'text' });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;