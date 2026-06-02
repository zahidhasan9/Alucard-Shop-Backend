import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
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

    image: {
      type: String,
      trim: true,
      default: '',
    },

     iconKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'shopping-bag',
      enum: [
        'shirt',
        'sparkles',
        'smartphone',
        'watch',
        'headphones',
        'baby',
        'shopping-bag',
        'gift',
        'monitor',
        'laptop',
        'camera',
        'shoe',
        'book-open',
        'home',
        'gamepad',
      ],
    },

    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
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

categorySchema.index({ name: 'text', description: 'text', slug: 'text' });

const Category = mongoose.model('Category', categorySchema);

export default Category;