// import express from 'express';
// import {
//   createCategory,
//   getAllCategories,
//   getCategory,
//   updateCategory,
//   deleteCategory,
// } from '../controllers/CategoryController.js';

// const router = express.Router();

// router.post('/', createCategory);
// router.get('/', getAllCategories);
// router.get('/:slug', getCategory);
// router.put('/:slug', updateCategory);
// router.delete('/:slug', deleteCategory);

// export default router;





import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/CategoryController.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:slug', getCategory);

router.post('/', protect, admin, createCategory);
router.put('/:slug', protect, admin, updateCategory);
router.delete('/:slug', protect, admin, deleteCategory);

export default router;