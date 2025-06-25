import express from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getProductsByCategory,
} from '../controllers/ProductController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

// protect,authRoute same funcetion
const router = express.Router();

// router.post('/add', upload.single('image'), protect, createProduct); //for in single image up load
router.post('/add', upload.array('images', 6), protect, createProduct);
router.get('/', getProducts);
router.get('/top', getTopProducts);
router.get('/:slug', getProduct);
router.delete('/:id', deleteProduct);
router.get('/category/:slug', getProductsByCategory);
router.put('/:id', updateProduct);
// router.put('/:id', authRoute, updateAddress);
// router.delete('/:id', authRoute, deleteAddress);

export default router;
