import express from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} from '../controllers/ProductController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

// protect,authRoute same funcetion
const router = express.Router();

router.post('/add', upload.single('image'), protect, createProduct);
router.get('/', getProducts);
router.get('/top', getTopProducts);
// router.get('/:type', authRoute, getAddressByType);
// router.put('/:id', authRoute, updateAddress);
// router.delete('/:id', authRoute, deleteAddress);

export default router;
