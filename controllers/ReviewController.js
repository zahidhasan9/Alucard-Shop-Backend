// controllers/reviewController.js
import Review from '../models/ReviewModel.js';

export const createReview = async (req, res) => {
  try {
    const { rating, comment, product } = req.body;

    if (!rating || !comment || !product) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

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
