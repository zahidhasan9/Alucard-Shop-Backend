// // controllers/reviewController.js
// import Review from '../models/ReviewModel.js';
// import Product from '../models/ProductModel.js';
// // import Order from '../models/OrderModel.js';

// export const createReview = async (req, res) => {
//   try {
//     const { rating, comment, product } = req.body;

//     if (!rating || !comment || !product) {
//       return res.status(400).json({ message: 'All fields are required.' });
//     }

  

//     const existingReview = await Review.findOne({
//       user: req.user._id,
//       product,
//     });

//     if (existingReview) {
//       return res.status(400).json({ message: 'You already reviewed this product.' });
//     }

//     const review = await Review.create({
//       user: req.user._id,
//       product,
//       rating,
//       comment,
//     });

//     // Update product rating after review
//     await updateProductRating(product);

//     res.status(201).json({
//       success: true,
//       message: 'Review created successfully',
//       review,
//     });
//   } catch (error) {
//     console.error('Error creating review:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while creating review.',
//     });
//   }
// };

// //User can delete ONLY their own review
// export const deleteMyReview = async (req, res) => {
//   try {
//     const { reviewId } = req.params;

//     const review = await Review.findById(reviewId);

//     if (!review) {
//       return res.status(404).json({ message: 'Review not found.' });
//     }

//     // Check if the logged-in user is the owner of the review
//     if (review.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'You are not allowed to delete this review.' });
//     }

//     await review.deleteOne();

//     // ✅ Update rating after deleting review
//     await updateProductRating(review.product);

//     res.status(200).json({
//       success: true,
//       message: 'Your review has been deleted.',
//     });
//   } catch (error) {
//     console.error('Error deleting user review:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while deleting your review.',
//     });
//   }
// };

// export const getProductReviews = async (req, res) => {
//   try {
//     const { productId } = req.params;

//     const reviews = await Review.find({ product: productId }).populate('user', 'firstName');

//     res.status(200).json({
//       success: true,
//       reviews,
//     });
//   } catch (error) {
//     console.error('Error fetching reviews:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching reviews.',
//     });
//   }
// };

// export const getUserAllReviews = async (req, res) => {
//   try {
//     const Id = req.user._id;
//     const reviews = await Review.find({ user: Id }).populate('product', 'name price slug');

//     res.status(200).json({
//       success: true,
//       reviews,
//     });
//   } catch (error) {
//     console.error('Error fetching reviews:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching reviews.',
//     });
//   }
// };

// // Admin can delete any review
// export const deleteReview = async (req, res) => {
//   try {
//     const { reviewId } = req.params;
//     const review = await Review.findById(reviewId);

//     if (!review) {
//       return res.status(404).json({ message: 'Review not found.' });
//     }

//     await review.deleteOne();
//     // Update rating after deleting review
//     await updateProductRating(review.product);

//     res.status(200).json({
//       success: true,
//       message: 'Review deleted successfully.',
//     });
//   } catch (error) {
//     console.error('Error deleting review:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while deleting review.',
//     });
//   }
// };

// export const createReviewTest = async (req, res) => {
//   try {
//     const { rating, comment, product } = req.body;

//     if (!rating || !comment || !product) {
//       return res.status(400).json({ message: 'All fields are required.' });
//     }

//     const review = await Review.create({
//       user: req.user._id,
//       product,
//       rating,
//       comment,
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Review created successfully',
//       review,
//     });
//   } catch (error) {
//     console.error('Error creating review:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while creating review.',
//     });
//   }
// };

// // ----------------utility function---------
// const updateProductRating = async productId => {
//   const reviews = await Review.find({ product: productId });

//   const numReviews = reviews.length;
//   const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / (numReviews || 1);

//   await Product.findByIdAndUpdate(productId, {
//     numReviews,
//     rating: averageRating.toFixed(1), // e.g. 4.5
//   });
// };






import mongoose from 'mongoose';
import Review from '../models/ReviewModel.js';
import Product from '../models/ProductModel.js';
import Order from '../models/OrderModel.js';

const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];

const updateProductRating = async (productId) => {
  const reviews = await Review.find({
    product: productId,
    status: 'approved',
    isApproved: true,
  });

  const numReviews = reviews.length;
  const averageRating =
    reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
    (numReviews || 1);

  await Product.findByIdAndUpdate(productId, {
    numReviews,
    rating: Number(averageRating.toFixed(1)),
  });
};

const findDeliveredOrderForProduct = async (userId, productId) => {
  return Order.findOne({
    user: userId,
    Delivery: 'delivered',
    'orderItems.product': productId,
  }).select('_id orderId');
};

export const createReview = async (req, res) => {
  try {
    const { rating, comment, product, images = [] } = req.body;

    if (!rating || !comment || !product) {
      return res.status(400).json({
        message: 'Rating, comment and product are required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        message: 'Invalid product ID.',
      });
    }

    const purchasedOrder = await findDeliveredOrderForProduct(
      req.user._id,
      product
    );

    if (!purchasedOrder) {
      return res.status(403).json({
        message:
          'You can review this product only after your order is delivered.',
      });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product,
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You already reviewed this product.',
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product,
      order: purchasedOrder._id,
      rating,
      comment,
      images,
      status: 'pending',
      isApproved: false,
      isVerifiedPurchase: true,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted. It will appear after admin approval.',
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating review.',
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({
      product: productId,
      status: 'approved',
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching reviews.',
    });
  }
};

export const getUserAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('product', 'name price slug thumbnail')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching reviews.',
    });
  }
};

export const deleteMyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You are not allowed to delete this review.',
      });
    }

    const productId = review.product;

    await review.deleteOne();
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      reviewId,
      message: 'Your review has been deleted.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting your review.',
    });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const {
      status = 'all',
      rating = 'all',
      verified = 'all',
      search = '',
    } = req.query;

    const match = {};

    if (status !== 'all') match.status = status;
    if (rating !== 'all') match.rating = Number(rating);
    if (verified === 'yes') match.isVerifiedPurchase = true;
    if (verified === 'no') match.isVerifiedPurchase = false;

    if (search.trim()) {
      match.comment = { $regex: search.trim(), $options: 'i' };
    }

    const reviews = await Review.find(match)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone')
      .populate('product', 'name slug thumbnail')
      .populate('order', 'orderId Delivery totalPrice')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    const stats = {
      total: await Review.countDocuments({}),
      pending: await Review.countDocuments({ status: 'pending' }),
      approved: await Review.countDocuments({ status: 'approved' }),
      hidden: await Review.countDocuments({ status: 'hidden' }),
      rejected: await Review.countDocuments({ status: 'rejected' }),
    };

    res.status(200).json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin reviews.',
    });
  }
};

export const getAdminReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)
      .populate('user', 'firstName lastName email phone')
      .populate('product', 'name slug thumbnail')
      .populate('order', 'orderId Delivery totalPrice')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch review.',
    });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, adminNote = '' } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid review status.',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    review.status = status;
    review.isApproved = status === 'approved';
    review.adminNote = adminNote;

    const updated = await review.save();

    await updateProductRating(review.product);

    const populated = await Review.findById(updated._id)
      .populate('user', 'firstName lastName email phone')
      .populate('product', 'name slug thumbnail')
      .populate('order', 'orderId Delivery totalPrice')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    res.status(200).json({
      success: true,
      message: 'Review status updated.',
      review: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review status.',
    });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        message: 'Reply message is required.',
      });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    review.adminReply = {
      message: message.trim(),
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };

    await review.save();

    const populated = await Review.findById(review._id)
      .populate('user', 'firstName lastName email phone')
      .populate('product', 'name slug thumbnail')
      .populate('order', 'orderId Delivery totalPrice')
      .populate('adminReply.repliedBy', 'firstName lastName role');

    res.status(200).json({
      success: true,
      message: 'Admin reply saved.',
      review: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reply to review.',
    });
  }
};

export const deleteReviewReply = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    review.adminReply = undefined;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Admin reply removed.',
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove review reply.',
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    const productId = review.product;

    await review.deleteOne();
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      reviewId,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting review.',
    });
  }
};