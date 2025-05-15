import express from 'express';
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} = require('../controllers/WishlistController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/', protect, getWishlist);
router.post('/add/:productId', protect, addToWishlist);
router.delete('/remove/:productId', protect, removeFromWishlist);

export default router;
