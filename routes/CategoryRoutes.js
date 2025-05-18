import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/CategoryController.js';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:slug', getCategory);
router.put('/:slug', updateCategory);
router.delete('/:slug', deleteCategory);

export default router;
