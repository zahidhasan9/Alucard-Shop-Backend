import express from 'express';
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDeliver,
  getOrders,
  getLastOrder,
  deleteOrder,
  updateOrderDeliveryStatus,
  updateDeliveryStatus,
} from '../controllers/OrderControllers.js';

import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addOrderItems); // Create new order (Private)
router.get('/my-orders', protect, getMyOrders); // Get current user's orders (Private)
router.get('/last-orders', protect, getLastOrder); // Get current user's orders (Private)
router.get('/', protect, admin, getOrders); // Get all orders (Admin only)
router.get('/:orderId', protect, getOrderById); // Get single order by ID (Private)
router.put('/:id/pay', protect, updateOrderToPaid); // Update order to paid (Private)
router.put('/:id/deliver', protect, admin, updateOrderToDeliver); // Update order to delivered (Admin only)
router.delete('/:orderId', protect, admin, deleteOrder);
router.put('/:orderId', protect, updateOrderDeliveryStatus);
router.put('/:id/delivery-status', protect, admin, updateDeliveryStatus);
export default router;
