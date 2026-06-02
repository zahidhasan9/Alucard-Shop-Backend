import express from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  getTopProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getFlashsellProducts,
  getAdminProducts,
  getAdminProduct,
  getRelatedProducts,
} from '../controllers/ProductController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/add', protect, admin, upload.array('images', 8), createProduct);
router.get('/', getProducts);
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/admin/:slug', protect, admin, getAdminProduct);
router.get('/featured', getFeaturedProducts);
router.get('/flashsell', getFlashsellProducts);
router.get('/top', getTopProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:slug/related', getRelatedProducts);
router.get('/:slug', getProduct);
router.put('/:slug', protect, admin, upload.array('images', 8), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
