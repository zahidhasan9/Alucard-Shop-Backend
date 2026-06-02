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
  updateDeliveryStatus,
  resetDeliveryStatus,
  updatePaymentStatus
  
  
} from '../controllers/OrderControllers.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addOrderItems);
router.get('/my-orders', protect, getMyOrders);
router.get('/last-orders', protect, getLastOrder);
router.get('/', protect, admin, getOrders);
router.get('/:orderId', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:orderId/payment-status', protect, admin, updatePaymentStatus);
// router.put('/:orderId/manual-payment', protect, submitManualPayment);
// router.put('/:orderId/verify-payment', protect, admin, verifyManualPayment);
router.put('/:id/deliver', protect, admin, updateOrderToDeliver);
router.delete('/:orderId', protect, admin, deleteOrder);
router.put('/:orderId/delivery-status', protect, admin, updateDeliveryStatus);
router.put('/:orderId/reset-status', protect, admin, resetDeliveryStatus);

export default router;
