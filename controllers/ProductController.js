import Product from '../models/ProductModel.js';
import Brand from '../models/BrandModel.js';
import Category from '../models/CategoryModel.js';
import { deleteImage } from '../utils/imageHandler.js';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

const parseJSON = value => {
  if (!value) return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getUploadedImages = req => {
  if (!req.files?.length) return [];
  if (process.env.UPLOAD_METHOD === 'cloudinary') return req.files.map(file => file.path);
  return req.files.map(file => `/uploads/${file.filename}`);
};

const makeSlug = async name => {
  let slug = slugify(name, { lower: true, strict: true });
  const exists = await Product.findOne({ slug });
  if (exists) slug = `${slug}-${nanoid(5)}`;
  return slug;
};

const normalizeVariants = variants => {
  const parsed = parseJSON(variants) || [];
  if (!Array.isArray(parsed)) return [];
  return parsed.map((variant, index) => ({
    ...variant,
    sku: variant.sku || `VAR-${nanoid(8)}`,
    label: variant.label || [variant.color, variant.size, variant.storage].filter(Boolean).join(' / ') || `Variant ${index + 1}`,
    price: variant.price === '' || variant.price === undefined ? undefined : Number(variant.price),
    oldPrice: variant.oldPrice === '' || variant.oldPrice === undefined ? undefined : Number(variant.oldPrice),
    stock: Number(variant.stock || 0),
  }));
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      brand,
      category,
      price,
      countInStock,
      oldPrice,
      isFeatured,
      flash_sell,
      metaTitle,
      metaDescription,
    } = req.body;

    const imageUrls = getUploadedImages(req);
    const variants = normalizeVariants(req.body.variants);
    const details = parseJSON(req.body.details) || [];
    const slug = await makeSlug(name);
    const sku = req.body.sku || `SKU-${nanoid(8)}`;

    const product = await Product.create({
      user: req.user._id,
      name,
      description,
      shortDescription,
      brand: brand || undefined,
      category,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : Number(price),
      slug,
      sku,
      countInStock: variants.length ? 0 : Number(countInStock || 0),
      thumbnail: imageUrls[0],
      images: imageUrls,
      variants,
      details,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      flash_sell: flash_sell === 'true' || flash_sell === true,
      metaTitle,
      metaDescription,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const totalAll = await Product.countDocuments({ isActive: true });
    const maxLimit = parseInt(process.env.PAGINATION_MAX_LIMIT) || 24;
    const limit = Math.min(Number(req.query.limit) || maxLimit, maxLimit);
    const skip = Math.max(Number(req.query.skip) || 0, 0);

    const {
      search = '',
      category,
      brand,
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      minRating = 0,
      stock,
      sort = 'latest',
    } = req.query;

    const filter = {
      isActive: true,
      price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
      rating: { $gte: Number(minRating) },
    };

    if (stock === 'in') filter.countInStock = { $gt: 0 };
    if (stock === 'out') filter.countInStock = { $lte: 0 };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const [matchedCategories, matchedBrands] = await Promise.all([
        Category.find({ name: regex }).select('_id'),
        Brand.find({ name: regex }).select('_id'),
      ]);

      filter.$or = [
        { name: regex },
        { slug: regex },
        { description: regex },
        { category: { $in: matchedCategories.map(item => item._id) } },
        { brand: { $in: matchedBrands.map(item => item._id) } },
      ];
    }

    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      rating: { rating: -1 },
      popular: { sold: -1, rating: -1 },
      discount: { discount: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] || sortMap.latest)
        .limit(limit)
        .skip(skip)
        .populate('category', 'name slug')
        .populate('brand', 'name slug'),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      total,
      totalAll,
      maxLimit,
      maxSkip: total ? total - 1 : 0,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    if (!product) return res.status(404).json({ message: 'Product not found!' });
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found!' });

    const imageUrls = getUploadedImages(req);
    if (imageUrls.length > 0) {
      if (product.thumbnail) await deleteImage(product.thumbnail);
      for (const img of product.images || []) await deleteImage(img);
      product.thumbnail = imageUrls[0];
      product.images = imageUrls;
    }

    const fields = [
      'name',
      'description',
      'shortDescription',
      'brand',
      'category',
      'metaTitle',
      'metaDescription',
    ];
    fields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') product[field] = req.body[field];
    });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.oldPrice !== undefined) product.oldPrice = Number(req.body.oldPrice);
    if (req.body.countInStock !== undefined) product.countInStock = Number(req.body.countInStock);
    if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    if (req.body.flash_sell !== undefined) product.flash_sell = req.body.flash_sell === 'true' || req.body.flash_sell === true;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.variants !== undefined) product.variants = normalizeVariants(req.body.variants);
    if (req.body.details !== undefined) product.details = parseJSON(req.body.details) || [];

    if (req.body.name && req.body.name !== product.name) product.slug = await makeSlug(req.body.name);

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.thumbnail) await deleteImage(product.thumbnail);
    for (const img of product.images || []) await deleteImage(img);
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ rating: -1 }).limit(8);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const filter = {
      isActive: true,
      category: category._id,
      price: {
        $gte: Number(req.query.minPrice) || 0,
        $lte: Number(req.query.maxPrice) || Number.MAX_SAFE_INTEGER,
      },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('brand', 'name slug'),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, currentPage: page, totalPages: Math.ceil(total / limit), data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .limit(8)
      .populate('brand', 'name slug')
      .populate('category', 'name slug');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured products', error: error.message });
  }
};

export const getFlashsellProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, flash_sell: true })
      .limit(8)
      .populate('brand', 'name slug')
      .populate('category', 'name slug');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flash sale products', error: error.message });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category brand');
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const related = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [{ category: product.category?._id }, { brand: product.brand?._id }],
    })
      .limit(Number(req.query.limit) || 8)
      .sort({ rating: -1, createdAt: -1 })
      .populate('category', 'name slug')
      .populate('brand', 'name slug');

    res.json({ success: true, products: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reduceProductStock = async orderItems => {
  for (const item of orderItems) {
    const product = await Product.findOne({ slug: item.slug });
    if (!product) throw new Error(`${item.name} not found.`);

    const qty = Number(item.qty || item.quantity || 1);
    if (item.variantId && product.variants?.length) {
      const variant = product.variants.id(item.variantId);
      if (!variant) throw new Error(`${item.name} variant not found.`);
      if (variant.stock < qty) throw new Error(`${item.name} is out of stock.`);
      variant.stock -= qty;
    } else {
      if (product.countInStock < qty) throw new Error(`${item.name} is out of stock.`);
      product.countInStock -= qty;
    }

    product.sold += qty;
    await product.save();
  }
};
