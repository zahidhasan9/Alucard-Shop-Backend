import express from 'express';
import {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequests,
  updateReturnRequestStatus,
} from '../controllers/ReturnRequestController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/', protect, upload.array('images', 4), createReturnRequest);
router.get('/my', protect, getMyReturnRequests);
router.get('/', protect, admin, getReturnRequests);
router.put('/:id/status', protect, admin, updateReturnRequestStatus);

export default router;
