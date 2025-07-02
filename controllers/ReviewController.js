// controllers/reviewController.js
import Review from '../models/ReviewModel.js';
import Product from '../models/ProductModel.js';
// import Order from '../models/OrderModel.js';

export const createReview = async (req, res) => {
  try {
    const { rating, comment, product } = req.body;

    if (!rating || !comment || !product) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    //  Check if the user purchased this product
    // const order = await Order.findOne({
    //   user: req.user._id,
    //   'orderItems.product': product,
    // });

    // if (!order) {
    //   return res.status(403).json({
    //     message: 'You must purchase this product before leaving a review.',
    //   });
    // }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You already reviewed this product.' });
    }

    const review = await Review.create({
      user: req.user._id,
      product,
      rating,
      comment,
    });

    // Update product rating after review
    await updateProductRating(product);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review.',
    });
  }
};

//User can delete ONLY their own review
export const deleteMyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    // Check if the logged-in user is the owner of the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to delete this review.' });
    }

    await review.deleteOne();

    // ✅ Update rating after deleting review
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: 'Your review has been deleted.',
    });
  } catch (error) {
    console.error('Error deleting user review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting your review.',
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId }).populate('user', 'firstName');

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews.',
    });
  }
};

export const getUserAllReviews = async (req, res) => {
  try {
    const Id = req.user._id;
    const reviews = await Review.find({ user: Id }).populate('product', 'name price slug');

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews.',
    });
  }
};

// Admin can delete any review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    await review.deleteOne();
    // Update rating after deleting review
    await updateProductRating(review.product);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting review.',
    });
  }
};

export const createReviewTest = async (req, res) => {
  try {
    const { rating, comment, product } = req.body;

    if (!rating || !comment || !product) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const review = await Review.create({
      user: req.user._id,
      product,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review.',
    });
  }
};

// ----------------utility function---------
const updateProductRating = async productId => {
  const reviews = await Review.find({ product: productId });

  const numReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / (numReviews || 1);

  await Product.findByIdAndUpdate(productId, {
    numReviews,
    rating: averageRating.toFixed(1), // e.g. 4.5
  });
};
