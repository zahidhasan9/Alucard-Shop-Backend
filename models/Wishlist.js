import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      require: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      require: true,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

// Create the Review model
const WishlistSchema = mongoose.model('Wishlist', wishlistSchema);
export default WishlistSchema;
