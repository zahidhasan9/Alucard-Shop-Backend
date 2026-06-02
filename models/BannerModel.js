import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
      default: '',
    },

    label: {
      type: String,
      trim: true,
      default: 'Featured',
    },

    buttonText: {
      type: String,
      trim: true,
      default: 'Shop Now',
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    linkType: {
      type: String,
      enum: ['products', 'category', 'brand', 'product', 'custom'],
      default: 'products',
    },

    link: {
      type: String,
      trim: true,
      default: '/products',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },

    startsAt: {
      type: Date,
      default: null,
    },

    endsAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bannerSchema.index({ title: 'text', subtitle: 'text', label: 'text' });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;