import mongoose from 'mongoose';

import Coupon from '../models/CouponModel.js';
import Product from '../models/ProductModel.js';

const roundMoney = (value) => Math.round(Number(value || 0));

const getCartProductId = (item) => {
  return item.productId || item.product || item._id || null;
};

const findProductFromCartItem = async (item) => {
  const possibleId = getCartProductId(item);

  if (possibleId && mongoose.Types.ObjectId.isValid(possibleId)) {
    const product = await Product.findById(possibleId);

    if (product) return product;
  }

  if (item.slug) {
    return Product.findOne({ slug: item.slug });
  }

  return null;
};

const getCouponUsageForUser = (coupon, userId) => {
  const record = coupon.usedBy.find(
    (item) => String(item.user) === String(userId)
  );

  return record?.count || 0;
};

const checkCouponValidity = async ({ couponCode, itemsPrice, shippingPrice, userId }) => {
  const code = String(couponCode || '').trim().toUpperCase();

  if (!code) {
    return {
      couponDoc: null,
      couponSummary: null,
      discountPrice: 0,
      shippingDiscount: 0,
      finalShippingPrice: shippingPrice,
      message: '',
    };
  }

  const coupon = await Coupon.findOne({ code });

  if (!coupon || !coupon.isActive) {
    const error = new Error('Invalid coupon code');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  if (coupon.startsAt && now < coupon.startsAt) {
    const error = new Error('This coupon is not active yet');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    const error = new Error('This coupon has expired');
    error.statusCode = 400;
    throw error;
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error('Coupon usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  const userUsedCount = getCouponUsageForUser(coupon, userId);

  if (userUsedCount >= coupon.perUserLimit) {
    const error = new Error('You have already used this coupon');
    error.statusCode = 400;
    throw error;
  }

  if (itemsPrice < coupon.minOrder) {
    const error = new Error(`Minimum order ৳${coupon.minOrder} required`);
    error.statusCode = 400;
    throw error;
  }

  let discountPrice = 0;
  let shippingDiscount = 0;

  if (coupon.type === 'percent') {
    discountPrice = roundMoney((itemsPrice * coupon.value) / 100);

    if (coupon.maxDiscount > 0) {
      discountPrice = Math.min(discountPrice, coupon.maxDiscount);
    }
  }

  if (coupon.type === 'fixed') {
    discountPrice = Math.min(roundMoney(coupon.value), itemsPrice);
  }

  if (coupon.type === 'shipping') {
    shippingDiscount = shippingPrice;
  }

  const finalShippingPrice = Math.max(0, shippingPrice - shippingDiscount);

  return {
    couponDoc: coupon,
    couponSummary: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountPrice,
      shippingDiscount,
    },
    discountPrice,
    shippingDiscount,
    finalShippingPrice,
    message: 'Coupon applied successfully',
  };
};

export const calculateServerOrderPricing = async ({
  cartItems = [],
  shippingPrice = 0,
  couponCode = '',
  userId,
}) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const error = new Error('No order items found');
    error.statusCode = 400;
    throw error;
  }

  const orderItems = [];
  const stockUpdates = [];

  for (const item of cartItems) {
    const product = await findProductFromCartItem(item);

    if (!product) {
      const error = new Error(`Product not found: ${item.name || item.slug || ''}`);
      error.statusCode = 404;
      throw error;
    }

    const qty = Number(item.quantity || item.qty || 1);

    if (qty < 1) {
      const error = new Error('Invalid product quantity');
      error.statusCode = 400;
      throw error;
    }

    if (Number(product.countInStock || 0) < qty) {
      const error = new Error(`${product.name} is out of stock or not enough stock`);
      error.statusCode = 400;
      throw error;
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      qty,
      image: item.image || product.thumbnail || product.images?.[0] || '',
      price: product.price,
      slug: product.slug,
      selectedVariants: item.selectedVariants || {},
    });

    stockUpdates.push({
      productId: product._id,
      qty,
    });
  }

  const itemsPrice = roundMoney(
    orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0)
  );

  const normalShippingPrice = roundMoney(shippingPrice);

  const couponResult = await checkCouponValidity({
    couponCode,
    itemsPrice,
    shippingPrice: normalShippingPrice,
    userId,
  });

  const totalPrice = Math.max(
    0,
    itemsPrice - couponResult.discountPrice + couponResult.finalShippingPrice
  );

  return {
    orderItems,
    stockUpdates,
    itemsPrice,
    shippingPrice: couponResult.finalShippingPrice,
    originalShippingPrice: normalShippingPrice,
    discountPrice: couponResult.discountPrice,
    shippingDiscount: couponResult.shippingDiscount,
    totalPrice,
    couponDoc: couponResult.couponDoc,
    couponSummary: couponResult.couponSummary,
    message: couponResult.message,
  };
};

export const commitCouponUsage = async (coupon, userId) => {
  if (!coupon) return;

  coupon.usedCount += 1;

  const record = coupon.usedBy.find(
    (item) => String(item.user) === String(userId)
  );

  if (record) {
    record.count += 1;
  } else {
    coupon.usedBy.push({
      user: userId,
      count: 1,
    });
  }

  await coupon.save();
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, cartItems, shippingPrice = 0 } = req.body;

    const pricing = await calculateServerOrderPricing({
      cartItems,
      shippingPrice,
      couponCode,
      userId: req.user._id,
    });

    res.status(200).json({
      valid: true,
      message: pricing.message || 'Coupon applied successfully',
      coupon: pricing.couponSummary,
      itemsPrice: pricing.itemsPrice,
      originalShippingPrice: pricing.originalShippingPrice,
      shippingPrice: pricing.shippingPrice,
      discountPrice: pricing.discountPrice,
      shippingDiscount: pricing.shippingDiscount,
      totalPrice: pricing.totalPrice,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      valid: false,
      message: error.message || 'Coupon apply failed',
    });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      code: String(req.body.code || '').trim().toUpperCase(),
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Coupon create failed',
    });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Coupon fetch failed',
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        code: req.body.code
          ? String(req.body.code).trim().toUpperCase()
          : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json(coupon);
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Coupon update failed',
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Coupon delete failed',
    });
  }
};

export const seedDefaultCoupons = async (req, res) => {
  try {
    const defaults = [
      {
        code: 'SAVE10',
        type: 'percent',
        value: 10,
        minOrder: 500,
        maxDiscount: 300,
        usageLimit: 1000,
        perUserLimit: 3,
        isActive: true,
      },
      {
        code: 'NEWUSER',
        type: 'fixed',
        value: 100,
        minOrder: 700,
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'FREESHIP',
        type: 'shipping',
        value: 0,
        minOrder: 1000,
        usageLimit: 1000,
        perUserLimit: 3,
        isActive: true,
      },
    ];

    for (const item of defaults) {
      await Coupon.findOneAndUpdate(
        { code: item.code },
        item,
        { upsert: true, new: true }
      );
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Default coupons seeded successfully',
      coupons,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Coupon seed failed',
    });
  }
};