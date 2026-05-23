import Cart from '../models/CartModel.js';

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart || { items: [] });
};

export const addToCart = async (req, res) => {
  try {
    const { productId, name, price, image, quantity = 1, slug, variantId, variantLabel } = req.body;
    if (!productId || !name || !slug) return res.status(400).json({ message: 'Invalid cart item.' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId && String(item.variantId || '') === String(variantId || '')
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ productId, name, price, image, quantity, slug, variantId, variantLabel });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found.' });
  const item = cart.items.find(i => i._id.toString() === productId || i.productId.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Cart item not found.' });
  item.quantity = Math.max(1, Number(quantity || 1));
  await cart.save();
  res.json(cart);
};

export const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.json({ items: [] });
  cart.items = cart.items.filter(i => i._id.toString() !== req.params.productId && i.productId.toString() !== req.params.productId);
  await cart.save();
  res.json(cart);
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
  res.json({ message: 'Cart cleared' });
};
