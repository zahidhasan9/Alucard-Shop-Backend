// import Order from '../models/OrderModel.js';
// import User from '../models/UserModel.js';
// import Coupon from '../models/CouponModel.js';
// import { calculateCouponDiscount } from './CouponController.js';
// import { reduceProductStock } from './ProductController.js';
// import { nanoid } from 'nanoid';

// export const addOrderItems = async (req, res, next) => {
//   try {
//     const {
//       cartItems,
//       shippingAddress,
//       paymentMethod,
//       itemsPrice,
//       taxPrice = 0,
//       shippingPrice = 0,
//       couponCode,
//       manualPayment,
//     } = req.body;

//     if (!cartItems || cartItems.length === 0) {
//       return res.status(400).json({ message: 'No order items.' });
//     }

//     const subtotal = Number(itemsPrice || 0);
//     let discountPrice = 0;
//     let shippingDiscount = 0;
//     let coupon = null;

//     if (couponCode) {
//       const result = await calculateCouponDiscount({
//         code: couponCode,
//         subtotal,
//         shippingPrice,
//         userId: req.user._id,
//       });
//       coupon = result.coupon;
//       discountPrice = result.discount;
//       shippingDiscount = result.shippingDiscount;
//     }

//     const finalShipping = Math.max(0, Number(shippingPrice) - shippingDiscount);
//     const totalPrice = Math.max(0, subtotal + Number(taxPrice) + finalShipping - discountPrice);
//     const orderId = `ORD-${nanoid(8).toUpperCase()}`;

//     const normalizedItems = cartItems.map(item => ({
//       name: item.name,
//       qty: Number(item.qty || item.quantity || 1),
//       image: item.image,
//       price: Number(item.price),
//       slug: item.slug,
//       product: item.productId || item.product || item._id,
//       variantId: item.variantId,
//       variantLabel: item.variantLabel,
//     }));

//     await reduceProductStock(normalizedItems);

//     const method = paymentMethod?.method || paymentMethod || 'cod';
//     const isManualPaid = ['bkash', 'nagad', 'rocket'].includes(method) && manualPayment?.transactionId;

//     const order = await Order.create({
//       user: req.user._id,
//       orderItems: normalizedItems,
//       shippingAddress,
//       paymentMethod: {
//         method,
//         status: method === 'cod' ? 'cod_pending' : isManualPaid ? 'submitted' : 'pending',
//         paidAt: null,
//       },
//       manualPayment: isManualPaid
//         ? {
//             provider: method,
//             senderNumber: manualPayment.senderNumber,
//             transactionId: manualPayment.transactionId,
//             amount: Number(manualPayment.amount || totalPrice),
//             submittedAt: new Date(),
//             status: 'submitted',
//           }
//         : undefined,
//       coupon: coupon
//         ? {
//             code: coupon.code,
//             type: coupon.type,
//             value: coupon.value,
//             discountPrice,
//             shippingDiscount,
//           }
//         : undefined,
//       discountPrice,
//       itemsPrice: subtotal,
//       taxPrice: Number(taxPrice),
//       shippingPrice: finalShipping,
//       totalPrice,
//       orderId,
//       tracking: [
//         {
//           status: 'pending',
//           message: 'Your order has been placed and is pending confirmation.',
//           date: new Date(),
//         },
//       ],
//     });

//     if (coupon) {
//       coupon.usedCount += 1;
//       coupon.usedBy.push({ user: req.user._id });
//       await coupon.save();
//     }

//     res.status(201).json(order);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getMyOrders = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const [orders, totalOrders, pendingOrders, deliveredOrders, confirmedOrders, shippedOrders] = await Promise.all([
//       Order.find({ user: userId }).sort({ createdAt: -1 }),
//       Order.countDocuments({ user: userId }),
//       Order.countDocuments({ user: userId, Delivery: 'pending' }),
//       Order.countDocuments({ user: userId, Delivery: 'delivered' }),
//       Order.countDocuments({ user: userId, Delivery: 'confirmed' }),
//       Order.countDocuments({ user: userId, Delivery: 'shipped' }),
//     ]);

//     res.status(200).json({ totalOrders, pendingOrders, deliveredOrders, confirmedOrders, shippedOrders, orders });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getOrderById = async (req, res, next) => {
//   try {
//     const order = await Order.findOne({ orderId: req.params.orderId }).populate('user', 'firstName lastName phone email');
//     if (!order) return res.status(404).json({ message: 'Order not found!' });
//     const owner = order.user?._id?.toString() === req.user._id.toString();
//     if (!owner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed.' });
//     res.status(200).json(order);
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateOrderToPaid = async (req, res, next) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found!' });

//     order.isPaid = true;
//     order.paidAt = new Date();
//     order.paymentMethod.status = 'paid';
//     order.paymentMethod.paidAt = new Date();
//     order.paymentResult = {
//       id: req.body.id,
//       status: req.body.status || 'paid',
//       update_time: req.body.updateTime || new Date().toISOString(),
//       email_address: req.body.email,
//     };

//     const updatedOrder = await order.save();
//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     next(error);
//   }
// };

// export const submitManualPayment = async (req, res, next) => {
//   try {
//     const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id });
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     const { provider, senderNumber, transactionId, amount } = req.body;
//     order.manualPayment = {
//       provider,
//       senderNumber,
//       transactionId,
//       amount: Number(amount || order.totalPrice),
//       submittedAt: new Date(),
//       status: 'submitted',
//     };
//     order.paymentMethod.method = provider;
//     order.paymentMethod.status = 'submitted';

//     await order.save();
//     res.json({ success: true, order });
//   } catch (error) {
//     next(error);
//   }
// };

// export const verifyManualPayment = async (req, res, next) => {
//   try {
//     const order = await Order.findOne({ orderId: req.params.orderId });
//     if (!order) return res.status(404).json({ message: 'Order not found.' });

//     const { status = 'verified', note } = req.body;
//     order.manualPayment.status = status;
//     order.manualPayment.verifiedAt = new Date();
//     order.manualPayment.verifiedBy = req.user._id;
//     order.manualPayment.adminNote = note;

//     if (status === 'verified') {
//       order.isPaid = true;
//       order.paidAt = new Date();
//       order.paymentMethod.status = 'paid';
//       order.paymentMethod.paidAt = new Date();
//       order.paymentResult = {
//         id: order.manualPayment.transactionId,
//         status: 'manual_verified',
//         update_time: new Date().toISOString(),
//       };
//     } else {
//       order.isPaid = false;
//       order.paymentMethod.status = 'rejected';
//     }

//     await order.save();
//     res.json({ success: true, order });
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateOrderToDeliver = async (req, res, next) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ message: 'Order not found!' });
//     order.Delivery = 'delivered';
//     order.deliveredAt = new Date();
//     order.tracking.push({ status: 'delivered', message: 'Your order has been delivered.', date: new Date() });
//     const updatedDeliver = await order.save();
//     res.status(200).json(updatedDeliver);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getOrders = async (req, res, next) => {
//   try {
//     const maxLimit = 20;
//     const limit = Math.min(Number(req.query.limit) || maxLimit, maxLimit);
//     const skip = Math.max(Number(req.query.skip) || 0, 0);
//     const search = req.query.search || '';
//     const regex = new RegExp(search, 'i');

//     let userIds = [];
//     if (search) {
//       userIds = await User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }] }).distinct('_id');
//     }

//     const filter = search ? { $or: [{ orderId: regex }, { user: { $in: userIds } }] } : {};
//     if (req.query.status) filter.Delivery = req.query.status;
//     if (req.query.paymentStatus === 'paid') filter.isPaid = true;
//     if (req.query.paymentStatus === 'unpaid') filter.isPaid = false;

//     const [orders, total] = await Promise.all([
//       Order.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('user', 'firstName lastName email phone'),
//       Order.countDocuments(filter),
//     ]);

//     res.status(200).json({ orders, total, maxLimit, maxSkip: total ? total - 1 : 0 });
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateDeliveryStatus = async (req, res, next) => {
//   try {
//     const { status, message } = req.body;
//     const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
//     if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid delivery status' });

//     const order = await Order.findOne({ orderId: req.params.orderId });
//     if (!order) return res.status(404).json({ message: 'Order not found' });

//     const currentIndex = validStatuses.indexOf(order.Delivery);
//     const newIndex = validStatuses.indexOf(status);
//     if (newIndex < currentIndex) return res.status(400).json({ message: 'Cannot update to previous status' });

//     const messages = {
//       pending: 'Your order is now pending.',
//       confirmed: 'Your order has been confirmed.',
//       shipped: 'Your order has been shipped.',
//       delivered: 'Your order has been delivered.',
//     };

//     const lastTracking = order.tracking[order.tracking.length - 1];
//     if (!lastTracking || lastTracking.status !== status) {
//       order.tracking.push({ status, message: message || messages[status], date: new Date() });
//     }

//     order.Delivery = status;
//     if (status === 'delivered') order.deliveredAt = new Date();

//     const updatedOrder = await order.save();
//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     next(error);
//   }
// };

// export const resetDeliveryStatus = async (req, res, next) => {
//   try {
//     const order = await Order.findOne({ orderId: req.params.orderId });
//     if (!order) return res.status(404).json({ message: 'Order not found' });
//     order.Delivery = 'pending';
//     order.deliveredAt = null;
//     order.tracking = [{ status: 'pending', message: 'Order status has been reset to pending.', date: new Date() }];
//     await order.save();
//     res.status(200).json({ message: 'Order status reset to pending.' });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getLastOrder = async (req, res) => {
//   const order = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(1);
//   if (!order || order.length === 0) return res.status(404).json({ message: 'No orders found' });
//   res.status(200).json(order[0]);
// };

// export const deleteOrder = async (req, res) => {
//   try {
//     const deleted = await Order.findOneAndDelete({ orderId: req.params.orderId });
//     if (!deleted) return res.status(404).json({ message: 'Order not found' });
//     res.status(200).json({ success: true, message: 'Order deleted' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import Product from '../models/ProductModel.js';
import Cart from '../models/CartModel.js';

import {
  calculateServerOrderPricing,
  commitCouponUsage,
} from './CouponController.js';

const addOrderItems = async (req, res) => {
  try {
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      taxPrice = 0,
      shippingPrice = 0,
      couponCode = '',
    } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'No order items.' });
    }

    if (
      !shippingAddress ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.division
    ) {
      return res.status(400).json({ message: 'Shipping address is required.' });
    }

    const pricing = await calculateServerOrderPricing({
      cartItems,
      shippingPrice,
      couponCode,
      userId: req.user._id,
    });

    const orderId = `ORD-${nanoid(8).toUpperCase()}`;

    const tracking = [
      {
        status: 'pending',
        message: 'Your order has been placed and is now pending.',
        date: new Date(),
      },
    ];

    const order = new Order({
      user: req.user._id,
      orderId,
      orderItems: pricing.orderItems,
      shippingAddress,
      paymentMethod: {
        method: paymentMethod?.method || paymentMethod || 'cod',
        status:
          paymentMethod?.method === 'manual' || paymentMethod === 'manual'
            ? 'submitted'
            : 'pending',
        transactionId: paymentMethod?.transactionId || null,
        paidAt: null,
      },
      coupon: pricing.couponSummary || undefined,
      itemsPrice: pricing.itemsPrice,
      taxPrice: Number(taxPrice || 0),
      shippingPrice: pricing.shippingPrice,
      originalShippingPrice: pricing.originalShippingPrice,
      discountPrice: pricing.discountPrice,
      totalPrice: pricing.totalPrice + Number(taxPrice || 0),
      tracking,
    });

    const createdOrder = await order.save();

    if (pricing.stockUpdates?.length) {
      await Product.bulkWrite(
        pricing.stockUpdates.map((item) => ({
          updateOne: {
            filter: {
              _id: item.productId,
              countInStock: { $gte: item.qty },
            },
            update: {
              $inc: { countInStock: -item.qty },
            },
          },
        }))
      );
    }

    if (pricing.couponDoc) {
      await commitCouponUsage(pricing.couponDoc, req.user._id);
    }

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Order create failed',
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      orders,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      confirmedOrders,
      shippedOrders,
    ] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }),
      Order.countDocuments({ user: userId }),
      Order.countDocuments({ user: userId, Delivery: 'pending' }),
      Order.countDocuments({ user: userId, Delivery: 'delivered' }),
      Order.countDocuments({ user: userId, Delivery: 'confirmed' }),
      Order.countDocuments({ user: userId, Delivery: 'shipped' }),
    ]);

    res.status(200).json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      confirmedOrders,
      shippedOrders,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Orders fetch failed' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    let order = await Order.findOne({ orderId }).populate(
      'user',
      'firstName lastName phone email'
    );

    if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate(
        'user',
        'firstName lastName phone email'
      );
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    const isOwner = String(order.user?._id || order.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed to view this order' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Order fetch failed' });
  }
};

const updateOrderToPaid = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod.status = 'paid';
    order.paymentMethod.paidAt = new Date();

    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.updateTime,
      email_address: req.body.email,
    };

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Payment update failed' });
  }
};

const updateOrderToDeliver = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found!' });
    }

    order.Delivery = 'delivered';
    order.deliveredAt = new Date();

    order.tracking.push({
      status: 'delivered',
      message: 'Your order has been delivered.',
      date: new Date(),
    });

    const updatedDeliver = await order.save();

    res.status(200).json(updatedDeliver);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Delivery update failed' });
  }
};

const getOrders = async (req, res) => {
  try {
    const maxLimit = 15;
    const limit = Number(req.query.limit) || maxLimit;
    const skip = Number(req.query.skip) || 0;
    const search = req.query.search || '';

    let userIds = [];

    if (search) {
      const regex = new RegExp(search, 'i');
      userIds = await User.find({ firstName: regex }).distinct('_id');
    }

    const regex = new RegExp(search, 'i');

    const filter = search
      ? { $or: [{ orderId: regex }, { user: { $in: userIds } }] }
      : {};

    const total = await Order.countDocuments(filter);
    const maxSkip = total ? total - 1 : 0;

    const orders = await Order.find(filter)
      .limit(limit > maxLimit ? maxLimit : limit)
      .skip(skip > maxSkip ? maxSkip : skip < 0 ? 0 : skip)
      .populate('user', 'id firstName lastName email');

    res.status(200).json({
      orders,
      total,
      maxLimit,
      maxSkip,
      filterUsed: filter,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Orders fetch failed' });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const currentIndex = validStatuses.indexOf(order.Delivery);
    const newIndex = validStatuses.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({ message: 'Cannot update to previous status' });
    }

    const messages = {
      pending: 'Your order is now pending.',
      confirmed: 'Your order has been confirmed.',
      shipped: 'Your order has been shipped.',
      delivered: 'Your order has been delivered.',
    };

    const lastTracking = order.tracking[order.tracking.length - 1];

    if (!lastTracking || lastTracking.status !== status) {
      order.tracking.push({
        status,
        message: messages[status],
        date: new Date(),
      });
    }

    order.Delivery = status;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Status update failed' });
  }
};

const resetDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.Delivery = 'pending';
    order.deliveredAt = null;
    order.tracking = [
      {
        status: 'pending',
        message: 'Order status has been reset to pending.',
        date: new Date(),
      },
    ];

    await order.save();

    res.status(200).json({ message: 'Order status reset to pending.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Status reset failed' });
  }
};

const getLastOrder = async (req, res) => {
  try {
    const order = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!order || order.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    res.status(200).json(order[0]);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Last order fetch failed' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deleted = await Order.findOneAndDelete({ orderId });

    if (!deleted && mongoose.Types.ObjectId.isValid(orderId)) {
      const deletedById = await Order.findByIdAndDelete(orderId);

      if (!deletedById) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Order delete failed' });
  }
};

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDeliver,
  getOrders,
  getLastOrder,
  deleteOrder,
  updateDeliveryStatus,
  resetDeliveryStatus
  
};