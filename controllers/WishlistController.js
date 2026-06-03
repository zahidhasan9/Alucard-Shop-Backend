import mongoose from 'mongoose';

import Wishlist from '../models/WishlistModel.js';
import Product from '../models/ProductModel.js';

const populateWishlist = async (wishlist) => {
  if (!wishlist) return null;

  return wishlist.populate({
    path: 'products',
    select:
      'name slug price oldPrice discount thumbnail images rating numReviews countInStock stock brand category',
    populate: [
      {
        path: 'category',
        select: 'name slug',
      },
      {
        path: 'brand',
        select: 'name slug',
      },
    ],
  });
};

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  return wishlist;
};

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    await populateWishlist(wishlist);

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      productIds: wishlist.products.map((product) => String(product._id)),
      products: wishlist.products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Wishlist fetch failed',
    });
  }
};

export const getWishlistIds = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      productIds: wishlist.products.map((id) => String(id)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Wishlist ids fetch failed',
    });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid productId is required',
      });
    }

    const productExists = await Product.exists({ _id: productId });

    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);

    const exists = wishlist.products.some(
      (id) => String(id) === String(productId)
    );

    if (exists) {
      wishlist.products = wishlist.products.filter(
        (id) => String(id) !== String(productId)
      );
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await populateWishlist(wishlist);

    res.status(200).json({
      success: true,
      added: !exists,
      message: !exists ? 'Added to wishlist' : 'Removed from wishlist',
      count: wishlist.products.length,
      productIds: wishlist.products.map((product) => String(product._id)),
      products: wishlist.products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Wishlist update failed',
    });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid productId is required',
      });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);

    wishlist.products = wishlist.products.filter(
      (id) => String(id) !== String(productId)
    );

    await wishlist.save();
    await populateWishlist(wishlist);

    res.status(200).json({
      success: true,
      message: 'Removed from wishlist',
      count: wishlist.products.length,
      productIds: wishlist.products.map((product) => String(product._id)),
      products: wishlist.products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Wishlist remove failed',
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { products: [] } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      count: 0,
      productIds: [],
      products: wishlist.products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Wishlist clear failed',
    });
  }
};