import express from 'express';
import { getWishlist, toggleWishlist, clearWishlist } from '../controllers/WishlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlist);
router.delete('/clear', protect, clearWishlist);

export default router;
