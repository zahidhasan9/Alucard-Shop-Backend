import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    label: { type: String, trim: true }, // Example: Black / XL / 128GB
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    storage: { type: String, trim: true },
    price: { type: Number, min: 0 },
    oldPrice: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    image: { type: String, trim: true },
    attributes: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true, index: true },
    thumbnail: { type: String, trim: true },
    images: [{ type: String }],
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true },
    product_type: { type: String, trim: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, default: 0, min: 0 },
    oldPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    slug: { type: String, required: true, unique: true, index: true },
    flash_sell: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    countInStock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    details: [
      {
        key: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
      },
    ],
    variants: [variantSchema],
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', slug: 'text' });
productSchema.index({ category: 1, brand: 1, price: 1, rating: -1 });

productSchema.pre('save', function updateStockAndDiscount(next) {
  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.countInStock = this.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  }

  const oldPrice = Number(this.oldPrice || this.price || 0);
  const price = Number(this.price || 0);
  this.discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
