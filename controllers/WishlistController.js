import Wishlist from '../models/WishlistModel.js';

export const getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' },
    ],
  });
  res.json({ success: true, products: wishlist?.products || [] });
};

export const toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required.' });

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

  const exists = wishlist.products.some(id => id.toString() === productId);
  if (exists) {
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
  } else {
    wishlist.products.push(productId);
  }

  await wishlist.save();
  await wishlist.populate('products');
  res.json({ success: true, added: !exists, products: wishlist.products });
};

export const clearWishlist = async (req, res) => {
  await Wishlist.findOneAndUpdate({ user: req.user._id }, { products: [] }, { upsert: true });
  res.json({ success: true, message: 'Wishlist cleared.' });
};
