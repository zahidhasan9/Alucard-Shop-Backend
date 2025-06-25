// controllers/cartController.js
import Cart from '../models/CartModel.js';

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart || { items: [] });
};

// const cart = await Cart.find({ user: req.user._id }).populate('product');
//   res.json(cart);

export const addToCart = async (req, res) => {
  const { productId, name, price, image, quantity, slug } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(i => i.productId.toString() === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId, name, price, image, quantity, slug });
  }

  await cart.save();
  res.json(cart);
};

export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  console.log('pro id', productId);

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart.items.find(i => i._id.toString() === productId);
  if (item) item.quantity = quantity;

  await cart.save();
  res.json(cart);
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter(i => i._id.toString() !== productId);
  await cart.save();
  res.json(cart);
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ message: 'Cart cleared' });
};
