import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    image: {
      type: String,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    variantLabel: {
      type: String,
      trim: true,
    },

    variantSku: {
      type: String,
      trim: true,
    },

    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);