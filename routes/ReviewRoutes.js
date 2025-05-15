// routes/reviewRoutes.js
import express from 'express';
import { createReview, getProductReviews } from '../controllers/ReviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
// import { hasPurchased } from "../middlewares/hasPurchased.js";

const router = express.Router();

// router.post("/", isAuthenticated, hasPurchased, createReview);
// router.get("/:productId", getProductReviews);

export default router;
