// import Cart from '../models/CartModel.js';

// export const getCart = async (req, res) => {
//   const cart = await Cart.findOne({ user: req.user._id });
//   res.json(cart || { items: [] });
// };

// export const addToCart = async (req, res) => {
//   try {
//     const { productId, name, price, image, quantity = 1, slug, variantId, variantLabel } = req.body;
//     if (!productId || !name || !slug) return res.status(400).json({ message: 'Invalid cart item.' });

//     let cart = await Cart.findOne({ user: req.user._id });
//     if (!cart) cart = new Cart({ user: req.user._id, items: [] });

//     const existingItem = cart.items.find(
//       item => item.productId.toString() === productId && String(item.variantId || '') === String(variantId || '')
//     );

//     if (existingItem) {
//       existingItem.quantity += Number(quantity);
//     } else {
//       cart.items.push({ productId, name, price, image, quantity, slug, variantId, variantLabel });
//     }

//     await cart.save();
//     res.json(cart);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateCartItem = async (req, res) => {
//   const { productId, quantity } = req.body;
//   const cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) return res.status(404).json({ message: 'Cart not found.' });
//   const item = cart.items.find(i => i._id.toString() === productId || i.productId.toString() === productId);
//   if (!item) return res.status(404).json({ message: 'Cart item not found.' });
//   item.quantity = Math.max(1, Number(quantity || 1));
//   await cart.save();
//   res.json(cart);
// };

// export const removeFromCart = async (req, res) => {
//   const cart = await Cart.findOne({ user: req.user._id });
//   if (!cart) return res.json({ items: [] });
//   cart.items = cart.items.filter(i => i._id.toString() !== req.params.productId && i.productId.toString() !== req.params.productId);
//   await cart.save();
//   res.json(cart);
// };

// export const clearCart = async (req, res) => {
//   await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
//   res.json({ message: 'Cart cleared' });
// };





import Cart from '../models/CartModel.js';
import Product from '../models/ProductModel.js';

const toNumber = value => Number(value || 0);

const getVariantLabel = variant => {
  if (!variant) return '';

  if (variant.label) return variant.label;

  const attributes = Array.isArray(variant.attributes)
    ? variant.attributes
        .filter(item => item?.key && item?.value)
        .map(item => `${item.key}: ${item.value}`)
        .join(' / ')
    : '';

  return attributes || variant.sku || '';
};

const getVariantAttributesMap = variant => {
  if (!variant || !Array.isArray(variant.attributes)) return {};

  return variant.attributes.reduce((acc, item) => {
    if (item?.key && item?.value !== undefined && item?.value !== null) {
      acc[item.key] = String(item.value);
    }

    return acc;
  }, {});
};

const findVariant = (product, variantId) => {
  if (!product || !variantId) return null;

  const id = String(variantId);

  return (
    product.variants?.id?.(id) ||
    product.variants?.find(item => String(item._id) === id) ||
    null
  );
};

const getCartItemStock = async item => {
  const product = await Product.findById(item.productId);

  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  if (item.variantId) {
    const variant = findVariant(product, item.variantId);

    if (!variant) {
      const error = new Error('Selected variant not found.');
      error.statusCode = 404;
      throw error;
    }

    return Number(variant.stock || 0);
  }

  return Number(product.countInStock || 0);
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    res.json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Cart fetch failed' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const {
      productId,
      quantity = 1,
      variantId,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    const qty = Math.max(1, Number(quantity || 1));
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const variant = variantId ? findVariant(product, variantId) : null;

    if (variantId && !variant) {
      return res.status(404).json({ message: 'Selected variant not found.' });
    }

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    if (hasVariants && !variant) {
      return res.status(400).json({ message: 'Please select a product variant.' });
    }

    const availableStock = variant
      ? Number(variant.stock || 0)
      : Number(product.countInStock || 0);

    if (availableStock < qty) {
      return res.status(400).json({
        message: `${product.name} has only ${availableStock} item(s) available.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(item => {
      const sameProduct = String(item.productId) === String(product._id);
      const sameVariant = String(item.variantId || '') === String(variant?._id || '');
      return sameProduct && sameVariant;
    });

    if (existingItem) {
      const nextQty = Number(existingItem.quantity || 0) + qty;

      if (nextQty > availableStock) {
        return res.status(400).json({
          message: `${product.name} has only ${availableStock} item(s) available.`,
        });
      }

      existingItem.quantity = nextQty;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: Number(variant?.price ?? product.price ?? 0),
        image:
          variant?.image ||
          product.thumbnail ||
          product.images?.[0] ||
          '',
        slug: product.slug,
        variantId: variant?._id,
        variantLabel: variant ? getVariantLabel(variant) : '',
        variantSku: variant?.sku || '',
        selectedVariants: variant ? getVariantAttributesMap(variant) : {},
        quantity: qty,
      });
    }

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Add to cart failed',
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const item = cart.items.find(cartItem => {
      const byCartItemId = String(cartItem._id) === String(productId);
      const byProductId = String(cartItem.productId) === String(productId);
      return byCartItemId || byProductId;
    });

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const nextQty = Math.max(1, Number(quantity || 1));
    const availableStock = await getCartItemStock(item);

    if (nextQty > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} item(s) available.`,
      });
    }

    item.quantity = nextQty;

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Cart update failed',
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.json({ items: [] });
    }

    cart.items = cart.items.filter(item => {
      const byCartItemId = String(item._id) === String(req.params.productId);
      const byProductId = String(item.productId) === String(req.params.productId);

      return !byCartItemId && !byProductId;
    });

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Cart remove failed' });
  }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { upsert: true }
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Cart clear failed' });
  }
};