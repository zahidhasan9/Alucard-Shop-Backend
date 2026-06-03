import express from 'express';
import {
  createReview,
  getProductReviews,
  getUserAllReviews,
  deleteMyReview,
  getAdminReviews,
  getAdminReviewById,
  updateReviewStatus,
  replyToReview,
  deleteReviewReply,
  deleteReview,
  getFeaturedReviews,
} from '../controllers/ReviewController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, admin, getAdminReviews);
router.get('/admin/:reviewId', protect, admin, getAdminReviewById);
router.patch('/admin/:reviewId/status', protect, admin, updateReviewStatus);
router.post('/admin/:reviewId/reply', protect, admin, replyToReview);
router.delete('/admin/:reviewId/reply', protect, admin, deleteReviewReply);
router.delete('/admin/:reviewId', protect, admin, deleteReview);
router.get('/featured', getFeaturedReviews);

router.post('/', protect, createReview);
router.get('/user', protect, getUserAllReviews);
router.delete('/me/:reviewId', protect, deleteMyReview);

router.get('/product/:productId', getProductReviews);

// Backward compatibility for existing frontend call: /review/:productId
router.get('/:productId', getProductReviews);

export default router;