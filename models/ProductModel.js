import mongoose from 'mongoose';

// Define the schema for products
const productSchema = new mongoose.Schema(
  {
    // Reference to the user who created the product
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Name of the product
    name: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    // Image URL of the product
    images: [
      {
        type: String,
      },
    ],
    // Description of the product
    description: {
      type: String,
      required: true,
    },
    // Brand of the product
    brand: {
      type: String,
    },
    // Category of the product
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    // Price of the product
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    // oldPrice of the product
    oldPrice: {
      type: Number,
      required: false,
    },
    // discount of the product
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    // Quantity available in stock
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    // Array of reviews associated with the product
    // reviews: [reviewSchema],
    // Overall rating of the product
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create the Product model
const Product = mongoose.model('Product', productSchema);

// Export the Product model
export default Product;
