import Product from '../models/productModel.js';
import { deleteImage } from '../utils/imageHandler.js';
// @desc     Create product
// @method   POST
// @endpoint /api/product/add
// @access   Private/Admin
// const createProduct = async (req, res) => {    // forsingle pic upload
//   try {
//     const { name, description, brand, category, price, countInStock } = req.body;
//     let imageUrl;
//     // if (process.env.UPLOAD_METHOD === 'cloudinary') {
//     //   console.log('Cloudinary response:', req.file); // Cloudinary responce
//     // }
//     if (process.env.UPLOAD_METHOD === 'cloudinary') {
//       imageUrl = imageUrl = req.file.path; // Cloudinary returns hosted image URL here
//     } else {
//       imageUrl = `/uploads/${req.file.filename}`; // For local
//     }
//     console.log('id p', req.file.path);
//     const product = new Product({
//       user: req.user._id,
//       name,
//       description,
//       brand,
//       category: req.user._id,
//       price,
//       countInStock,
//       image: imageUrl,
//     });

//     await product.save();
//     res.status(201).json({ success: true, product });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error });
//     // console.log(error);
//   }
// };

const createProduct = async (req, res) => {
  try {
    const { name, description, brand, category, price, countInStock } = req.body;
    let imageUrls;

    if (process.env.UPLOAD_METHOD === 'cloudinary') {
      imageUrls = req.files.map(file => file.path); // Cloudinary hosted URLs
    } else {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`); // Local upload paths
    }
    const product = new Product({
      user: req.user._id,
      name,
      description,
      brand,
      category: req.user._id,
      price,
      countInStock,
      thumbnail: imageUrls[0],
      images: imageUrls.slice(1),
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// @desc     Fetch All Products
// @method   GET
// @endpoint /api/v1/products?limit=2&skip=0
// @access   Public
const getProducts = async (req, res, next) => {
  try {
    const total = await Product.countDocuments();
    const maxLimit = process.env.PAGINATION_MAX_LIMIT;
    const maxSkip = total === 0 ? 0 : total - 1;
    const limit = Number(req.query.limit) || maxLimit;
    const skip = Number(req.query.skip) || 0;
    const search = req.query.search || '';

    const products = await Product.find({
      name: { $regex: search, $options: 'i' },
    })
      .limit(limit > maxLimit ? maxLimit : limit)
      .skip(skip > maxSkip ? maxSkip : skip < 0 ? 0 : skip);

    if (!products || products.length === 0) {
      res.statusCode = 404;
      throw new Error('Products not found!');
    }

    res.status(200).json({
      products,
      total,
      maxLimit,
      maxSkip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Fetch top products
// @method   GET
// @endpoint /api/v1/products/top
// @access   Public
const getTopProducts = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ rating: -1 }).limit(3);

    if (!products) {
      res.statusCode = 404;
      throw new Error('Product not found!');
    }

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc     Fetch Single Product
// @method   GET
// @endpoint /api/v1/products/:id
// @access   Public
const getProduct = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      res.statusCode = 404;
      throw new Error('Product not found!');
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc     Update product
// @method   PUT
// @endpoint /api/v1/products/:id
// @access   Private/Admin

const updateProduct = async (req, res, next) => {
  try {
    const { name, image, description, brand, category, price, countInStock } = req.body;
    let imageUrls;
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.statusCode = 404;
      throw new Error('Product not found!');
    }

    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary or local server
      await deleteImage(product.thumbnail);
      for (const img of product.images) {
        await deleteImage(img);
      }

      // Set new image URLs
      if (process.env.UPLOAD_METHOD === 'cloudinary') {
        imageUrls = req.files.map(file => file.path); // Cloudinary hosted URLs
      } else {
        imageUrls = req.files.map(file => `/uploads/${file.filename}`); // Local upload paths
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.price = price || product.price;
    product.countInStock = countInStock || product.countInStock;
    // Update image URLs only if new images are uploaded
    if (imageUrls.length > 0) {
      product.thumbnail = imageUrls[0]; // First image as thumbnail
      product.images = imageUrls.slice(1); // Remaining images
    }
    const updatedProduct = await product.save();

    res.status(200).json({ message: 'Product updated', updatedProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @method   DELETE
// @endpoint /api/v1/products/:id
// @access   Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await deleteImage(product.thumbnail);

    for (const img of product.images) {
      await deleteImage(img);
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Create product review
// @method   POST
// @endpoint /api/v1/products/reviews/:id
// @access   Admin
const createProductReview = async (req, res, next) => {
  try {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      res.statusCode = 404;
      throw new Error('Product not found!');
    }

    const alreadyReviewed = product.reviews.find(
      review => review.user._id.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.statusCode = 400;
      throw new Error('Product already reviewed');
    }

    const review = {
      user: req.user,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews = [...product.reviews, review];

    product.rating =
      product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
    product.numReviews = product.reviews.length;

    await product.save();

    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    next(error);
  }
};

export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
};
