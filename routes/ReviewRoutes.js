// routes/reviewRoutes.js
import express from 'express';
import {
  createReview,
  getProductReviews,
  deleteMyReview,
  deleteReview,
  createReviewTest,
  getUserAllReviews,
} from '../controllers/ReviewController.js';
import { protect, authRoute } from '../middlewares/authMiddleware.js';
// import { hasPurchased } from "../middlewares/hasPurchased.js";

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user', protect, getUserAllReviews);
router.get('/:productId', getProductReviews);

// router.post("/", isAuthenticated, hasPurchased, createReview);
// router.get("/:productId", getProductReviews);

export default router;
