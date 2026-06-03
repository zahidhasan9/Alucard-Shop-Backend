import express from 'express';
import {
  createBrand,
  getAllBrands,
  getAdminBrands,
  getBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand,
} from '../controllers/BrandController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, admin, getAdminBrands);
router.get('/', getAllBrands);
router.get('/:slug', getBrand);

router.post('/', protect, admin, createBrand);
router.put('/:slug', protect, admin, updateBrand);
router.patch('/:slug/status', protect, admin, toggleBrandStatus);
router.delete('/:slug', protect, admin, deleteBrand);

export default router;