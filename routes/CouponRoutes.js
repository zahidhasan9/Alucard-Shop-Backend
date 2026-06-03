import express from 'express';

import {
  applyCoupon,
  createCoupon,
  deleteCoupon,
  getCoupons,
  seedDefaultCoupons,
  updateCoupon,
} from '../controllers/CouponController.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/apply', protect, applyCoupon);

router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);

router.post('/seed-default', protect, admin, seedDefaultCoupons);
router.post('/seed-defaults', protect, admin, seedDefaultCoupons);

router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;