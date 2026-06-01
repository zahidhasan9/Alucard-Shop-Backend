import express from 'express';
import { getDashboardStats } from '../controllers/DashboardController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);

export default router;