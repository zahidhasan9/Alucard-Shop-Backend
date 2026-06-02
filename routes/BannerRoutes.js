import express from 'express';
import {
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAdminBanners,
  getBannerById,
  toggleBannerStatus,
  updateBanner,
} from '../controllers/BannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get('/', getActiveBanners);

router.get('/admin/all', protect, admin, getAdminBanners);
router.get('/admin/:id', protect, admin, getBannerById);

router.post('/', protect, admin, upload.single('image'), createBanner);
router.put('/:id', protect, admin, upload.single('image'), updateBanner);
router.patch('/:id/status', protect, admin, toggleBannerStatus);
router.delete('/:id', protect, admin, deleteBanner);

export default router;