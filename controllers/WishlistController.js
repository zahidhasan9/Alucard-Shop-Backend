const User = require('../models/user.model');

const addToWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  // Convert ObjectId to string for comparison
  const alreadyInWishlist = user.wishlist.map(id => id.toString()).includes(productId);

  if (alreadyInWishlist) {
    return res.status(400).json({
      success: false,
      message: 'Product is already in wishlist',
    });
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(200).json({ success: true, wishlist: user.wishlist });
};

const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  res.status(200).json({ success: true, wishlist: user.wishlist });
};

const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.status(200).json({ success: true, wishlist: user.wishlist });
};

export { addToWishlist, getWishlist, removeFromWishlist };
