import express from 'express';

import {
  clearWishlist,
  getWishlist,
  getWishlistIds,
  removeWishlistItem,
  toggleWishlist,
} from '../controllers/WishlistController.js';

import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWishlist);
router.get('/ids', protect, getWishlistIds);
router.post('/toggle', protect, toggleWishlist);
router.delete('/clear', protect, clearWishlist);
router.delete('/:productId', protect, removeWishlistItem);

export default router;