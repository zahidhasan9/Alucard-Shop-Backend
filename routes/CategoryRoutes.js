import express from 'express';
import {
  createCategory,
  getAllCategories,
  getAdminCategories,
  getCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from '../controllers/CategoryController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, admin, getAdminCategories);
router.get('/', getAllCategories);
router.get('/:slug', getCategory);

router.post('/', protect, admin, createCategory);
router.put('/:slug', protect, admin, updateCategory);
router.patch('/:slug/status', protect, admin, toggleCategoryStatus);
router.delete('/:slug', protect, admin, deleteCategory);

export default router;