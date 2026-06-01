

// import mongoose from 'mongoose';
// import { nanoid } from 'nanoid';

// import Order from '../models/OrderModel.js';
// import User from '../models/UserModel.js';
// import Product from '../models/ProductModel.js';
// import Cart from '../models/CartModel.js';

// import {
//   calculateServerOrderPricing,
//   commitCouponUsage,
// } from './CouponController.js';

// const addOrderItems = async (req, res) => {
//   try {
//     const {
//       cartItems,
//       shippingAddress,
//       paymentMethod,
//       taxPrice = 0,
//       shippingPrice = 0,
//       couponCode = '',
//       manualPayment,
//       coupon,
//       discountPrice = 0,
//       originalShippingPrice,
//     } = req.body;

//     if (!cartItems || cartItems.length === 0) {
//       return res.status(400).json({ message: 'No order items.' });
//     }

//     if (
//       !shippingAddress ||
//       !shippingAddress.address ||
//       !shippingAddress.city ||
//       !shippingAddress.postalCode ||
//       !shippingAddress.division
//     ) {
//       return res.status(400).json({ message: 'Shipping address is required.' });
//     }

//     const pricing = await calculateServerOrderPricing({
//       cartItems,
//       shippingPrice,
//       couponCode,
//       userId: req.user._id,
//     });

//     const orderId = `ORD-${nanoid(8).toUpperCase()}`;

//     const tracking = [
//       {
//         status: 'pending',
//         message: 'Your order has been placed and is now pending.',
//         date: new Date(),
//       },
//     ];

//     const order = new Order({
//       user: req.user._id,
//       orderId,
//       orderItems: pricing.orderItems,
//       shippingAddress,
//       paymentMethod: {
//         method: paymentMethod?.method || paymentMethod || 'cod',
//         status:
//           paymentMethod?.method === 'manual' || paymentMethod === 'manual'
//             ? 'submitted'
//             : 'pending',
//         transactionId: paymentMethod?.transactionId || null,
//         paidAt: null,
//       },
//       coupon: pricing.couponSummary || undefined,
//       itemsPrice: pricing.itemsPrice,
//       taxPrice: Number(taxPrice || 0),
//       shippingPrice: pricing.shippingPrice,
//       originalShippingPrice: pricing.originalShippingPrice,
//       discountPrice: pricing.discountPrice,
//       totalPrice: pricing.totalPrice + Number(taxPrice || 0),
//       tracking,
//       manualPayment:
//           paymentMethod?.method === 'manual'
//             ? {
//                 provider: manualPayment?.provider,
//                 senderNumber: manualPayment?.senderNumber,
//                 transactionId: manualPayment?.transactionId,
//                 amount: manualPayment?.amount,
//                 status: 'submitted',
//               }
//             : undefined,

//       coupon: coupon || undefined,
//       discountPrice: Number(discountPrice || 0),
//       originalShippingPrice: Number(originalShippingPrice || shippingPrice || 0),
//           });

//     const createdOrder = await order.save();

//     if (pricing.stockUpdates?.length) {
//       await Product.bulkWrite(
//         pricing.stockUpdates.map((item) => ({
//           updateOne: {
//             filter: {
//               _id: item.productId,
//               countInStock: { $gte: item.qty },
//             },
//             update: {
//               $inc: { countInStock: -item.qty },
//             },
//           },
//         }))
//       );
//     }

//     if (pricing.couponDoc) {
//       await commitCouponUsage(pricing.couponDoc, req.user._id);
//     }

//     await Cart.findOneAndUpdate(
//       { user: req.user._id },
//       { $set: { items: [] } },
//       { new: true }
//     );

//     res.status(201).json(createdOrder);
//   } catch (error) {
//     res.status(error.statusCode || 500).json({
//       message: error.message || 'Order create failed',
//     });
//   }
// };

// const getMyOrders = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const [
//       orders,
//       totalOrders,
//       pendingOrders,
//       deliveredOrders,
//       confirmedOrders,
//       shippedOrders,
//     ] = await Promise.all([
//       Order.find({ user: userId }).sort({ createdAt: -1 }),
//       Order.countDocuments({ user: userId }),
//       Order.countDocuments({ user: userId, Delivery: 'pending' }),
//       Order.countDocuments({ user: userId, Delivery: 'delivered' }),
//       Order.countDocuments({ user: userId, Delivery: 'confirmed' }),
//       Order.countDocuments({ user: userId, Delivery: 'shipped' }),
//     ]);

//     res.status(200).json({
//       totalOrders,
//       pendingOrders,
//       deliveredOrders,
//       confirmedOrders,
//       shippedOrders,
//       orders,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Orders fetch failed' });
//   }
// };

// const getOrderById = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     let order = await Order.findOne({ orderId }).populate(
//       'user',
//       'firstName lastName phone email'
//     );

//     if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
//       order = await Order.findById(orderId).populate(
//         'user',
//         'firstName lastName phone email'
//       );
//     }

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found!' });
//     }

//     const isOwner = String(order.user?._id || order.user) === String(req.user._id);
//     const isAdmin = req.user.role === 'admin';

//     if (!isOwner && !isAdmin) {
//       return res.status(403).json({ message: 'Not allowed to view this order' });
//     }

//     res.status(200).json(order);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Order fetch failed' });
//   }
// };

// const updateOrderToPaid = async (req, res) => {
//   try {
//     const { id: orderId } = req.params;

//     const order = mongoose.Types.ObjectId.isValid(orderId)
//       ? await Order.findById(orderId)
//       : await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found!' });
//     }

//     order.isPaid = true;
//     order.paidAt = new Date();
//     order.paymentMethod.status = 'paid';
//     order.paymentMethod.paidAt = new Date();

//     order.paymentResult = {
//       id: req.body.id,
//       status: req.body.status,
//       update_time: req.body.updateTime,
//       email_address: req.body.email,
//     };

//     const updatedOrder = await order.save();

//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Payment update failed' });
//   }
// };

// const updateOrderToDeliver = async (req, res) => {
//   try {
//     const { id: orderId } = req.params;

//     const order = mongoose.Types.ObjectId.isValid(orderId)
//       ? await Order.findById(orderId)
//       : await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found!' });
//     }

//     order.Delivery = 'delivered';
//     order.deliveredAt = new Date();

//     order.tracking.push({
//       status: 'delivered',
//       message: 'Your order has been delivered.',
//       date: new Date(),
//     });

//     const updatedDeliver = await order.save();

//     res.status(200).json(updatedDeliver);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Delivery update failed' });
//   }
// };

// const getOrders = async (req, res) => {
//   try {
//     const maxLimit = 15;
//     const limit = Number(req.query.limit) || maxLimit;
//     const skip = Number(req.query.skip) || 0;
//     const search = req.query.search || '';

//     let userIds = [];

//     if (search) {
//       const regex = new RegExp(search, 'i');
//       userIds = await User.find({ firstName: regex }).distinct('_id');
//     }

//     const regex = new RegExp(search, 'i');

//     const filter = search
//       ? { $or: [{ orderId: regex }, { user: { $in: userIds } }] }
//       : {};

//     const total = await Order.countDocuments(filter);
//     const maxSkip = total ? total - 1 : 0;

//     const orders = await Order.find(filter)
//       .limit(limit > maxLimit ? maxLimit : limit)
//       .skip(skip > maxSkip ? maxSkip : skip < 0 ? 0 : skip)
//       .populate('user', 'id firstName lastName email');

//     res.status(200).json({
//       orders,
//       total,
//       maxLimit,
//       maxSkip,
//       filterUsed: filter,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Orders fetch failed' });
//   }
// };

// const updateDeliveryStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: 'Invalid delivery status' });
//     }

//     const order = await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const currentIndex = validStatuses.indexOf(order.Delivery);
//     const newIndex = validStatuses.indexOf(status);

//     if (newIndex < currentIndex) {
//       return res.status(400).json({ message: 'Cannot update to previous status' });
//     }

//     const messages = {
//       pending: 'Your order is now pending.',
//       confirmed: 'Your order has been confirmed.',
//       shipped: 'Your order has been shipped.',
//       delivered: 'Your order has been delivered.',
//     };

//     const lastTracking = order.tracking[order.tracking.length - 1];

//     if (!lastTracking || lastTracking.status !== status) {
//       order.tracking.push({
//         status,
//         message: messages[status],
//         date: new Date(),
//       });
//     }

//     order.Delivery = status;

//     if (status === 'delivered') {
//       order.deliveredAt = new Date();
//     }

//     const updatedOrder = await order.save();

//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Status update failed' });
//   }
// };

// const resetDeliveryStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     order.Delivery = 'pending';
//     order.deliveredAt = null;
//     order.tracking = [
//       {
//         status: 'pending',
//         message: 'Order status has been reset to pending.',
//         date: new Date(),
//       },
//     ];

//     await order.save();

//     res.status(200).json({ message: 'Order status reset to pending.' });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Status reset failed' });
//   }
// };

// const getLastOrder = async (req, res) => {
//   try {
//     const order = await Order.find({ user: req.user._id })
//       .sort({ createdAt: -1 })
//       .limit(1);

//     if (!order || order.length === 0) {
//       return res.status(404).json({ message: 'No orders found' });
//     }

//     res.status(200).json(order[0]);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Last order fetch failed' });
//   }
// };

// const deleteOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const deleted = await Order.findOneAndDelete({ orderId });

//     if (!deleted && mongoose.Types.ObjectId.isValid(orderId)) {
//       const deletedById = await Order.findByIdAndDelete(orderId);

//       if (!deletedById) {
//         return res.status(404).json({ message: 'Order not found' });
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order deleted',
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Order delete failed' });
//   }
// };

// export {
//   addOrderItems,
//   getMyOrders,
//   getOrderById,
//   updateOrderToPaid,
//   updateOrderToDeliver,
//   getOrders,
//   getLastOrder,
//   deleteOrder,
//   updateDeliveryStatus,
//   resetDeliveryStatus
  
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

const reduceStockUpdates = async stockUpdates => {
  for (const item of stockUpdates || []) {
    const qty = Number(item.qty || 0);

    if (!qty || qty < 1) continue;

    if (item.variantId) {
      const result = await Product.updateOne(
        {
          _id: item.productId,
          variants: {
            $elemMatch: {
              _id: item.variantId,
              stock: { $gte: qty },
            },
          },
          countInStock: { $gte: qty },
        },
        {
          $inc: {
            'variants.$.stock': -qty,
            countInStock: -qty,
          },
        }
      );

      if (!result.modifiedCount && !result.nModified) {
        const error = new Error('Selected variant stock is not available.');
        error.statusCode = 400;
        throw error;
      }
    } else {
      const result = await Product.updateOne(
        {
          _id: item.productId,
          countInStock: { $gte: qty },
        },
        {
          $inc: {
            countInStock: -qty,
          },
        }
      );

      if (!result.modifiedCount && !result.nModified) {
        const error = new Error('Product stock is not available.');
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

const addOrderItems = async (req, res) => {
  let createdOrder = null;

  try {
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      taxPrice = 0,
      shippingPrice = 0,
      couponCode = '',
      coupon,
      manualPayment,
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

    const method = paymentMethod?.method || paymentMethod || 'cod';
    const transactionId =
      paymentMethod?.transactionId || manualPayment?.transactionId || '';

    if (method === 'manual' && !String(transactionId).trim()) {
      return res.status(400).json({
        message: 'Transaction ID is required for manual payment.',
      });
    }

    const finalCouponCode = couponCode || coupon?.code || '';

    const pricing = await calculateServerOrderPricing({
      cartItems,
      shippingPrice,
      couponCode: finalCouponCode,
      userId: req.user._id,
    });

    const orderId = `ORD-${nanoid(8).toUpperCase()}`;
    const totalWithTax = pricing.totalPrice + Number(taxPrice || 0);

    const order = new Order({
      user: req.user._id,
      orderId,
      orderItems: pricing.orderItems,
      shippingAddress,

      paymentMethod: {
        method,
        status: method === 'manual' ? 'submitted' : 'pending',
        transactionId: transactionId || null,
        paidAt: null,
      },

      manualPayment:
        method === 'manual'
          ? {
              provider: manualPayment?.provider || 'bkash',
              senderNumber:
                manualPayment?.senderNumber || shippingAddress?.phone || '',
              transactionId,
              amount: Number(manualPayment?.amount || totalWithTax),
              submittedAt: new Date(),
              status: 'submitted',
            }
          : undefined,

      coupon: pricing.couponSummary || undefined,
      itemsPrice: pricing.itemsPrice,
      taxPrice: Number(taxPrice || 0),
      shippingPrice: pricing.shippingPrice,
      originalShippingPrice: pricing.originalShippingPrice,
      discountPrice: pricing.discountPrice,
      totalPrice: totalWithTax,

      tracking: [
        {
          status: 'pending',
          message: 'Your order has been placed and is now pending.',
          date: new Date(),
        },
      ],
    });

    createdOrder = await order.save();

    if (shippingAddress?.phone) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            phone: shippingAddress.phone,
          },
        },
        { new: true }
      );
    }

    try {
      await reduceStockUpdates(pricing.stockUpdates);
    } catch (stockError) {
      await Order.findByIdAndDelete(createdOrder._id);
      throw stockError;
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
      status: req.body.status || 'paid',
      update_time: req.body.updateTime || new Date().toISOString(),
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

      userIds = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { phone: regex },
        ],
      }).distinct('_id');
    }

    const regex = new RegExp(search, 'i');

    const filter = search
      ? {
          $or: [
            { orderId: regex },
            { user: { $in: userIds } },
          ],
        }
      : {};

    if (req.query.status) filter.Delivery = req.query.status;
    if (req.query.paymentStatus === 'paid') filter.isPaid = true;
    if (req.query.paymentStatus === 'unpaid') filter.isPaid = false;

    const total = await Order.countDocuments(filter);
    const maxSkip = total ? total - 1 : 0;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit > maxLimit ? maxLimit : limit)
      .skip(skip > maxSkip ? maxSkip : skip < 0 ? 0 : skip)
      .populate('user', 'id firstName lastName email phone');

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

// const updateDeliveryStatus = async (req, res) => {

//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;

//     const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: 'Invalid delivery status' });
//     }

//     const order = await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const currentIndex = validStatuses.indexOf(order.Delivery);
//     const newIndex = validStatuses.indexOf(status);

//     if (newIndex < currentIndex) {
//       return res.status(400).json({ message: 'Cannot update to previous status' });
//     }

//     const messages = {
//       pending: 'Your order is now pending.',
//       confirmed: 'Your order has been confirmed.',
//       shipped: 'Your order has been shipped.',
//       delivered: 'Your order has been delivered.',
//     };

//     const lastTracking = order.tracking[order.tracking.length - 1];

//     if (!lastTracking || lastTracking.status !== status) {
//       order.tracking.push({
//         status,
//         message: messages[status],
//         date: new Date(),
//       });
//     }

//     order.Delivery = status;

//     if (status === 'delivered') {
//       order.deliveredAt = new Date();
//     }

//     const updatedOrder = await order.save();

//     res.status(200).json(updatedOrder);
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Status update failed' });
//   }
// };


const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid delivery status',
      });
    }

    const order = await findOrderByAnyId(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const currentIndex = validStatuses.indexOf(order.Delivery);
    const newIndex = validStatuses.indexOf(status);

    if (newIndex < currentIndex) {
      return res.status(400).json({
        message: 'Cannot update to previous status. Please reset status first.',
      });
    }

    const messages = {
      pending: 'Your order is now pending.',
      confirmed: 'Your order has been confirmed.',
      shipped: 'Your order has been shipped.',
      delivered: 'Your order has been delivered.',
    };

    const lastTracking = order.tracking?.[order.tracking.length - 1];

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
    } else {
      order.deliveredAt = null;
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Status update failed',
    });
  }
};


// const resetDeliveryStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findOne({ orderId });

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     order.Delivery = 'pending';
//     order.deliveredAt = null;

//     order.tracking = [
//       {
//         status: 'pending',
//         message: 'Order status has been reset to pending.',
//         date: new Date(),
//       },
//     ];

//     await order.save();

//     res.status(200).json({ message: 'Order status reset to pending.' });
//   } catch (error) {
//     res.status(500).json({ message: error.message || 'Status reset failed' });
//   }
// };


const resetDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await findOrderByAnyId(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
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

    const updatedOrder = await order.save();

    res.status(200).json({
      message: 'Order status reset to pending.',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Status reset failed',
    });
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

    let deleted = await Order.findOneAndDelete({ orderId });

    if (!deleted && mongoose.Types.ObjectId.isValid(orderId)) {
      deleted = await Order.findByIdAndDelete(orderId);
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted',
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Order delete failed' });
  }
};




const findOrderByAnyId = async (orderId) => {
  let order = await Order.findOne({ orderId });

  if (!order && mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  }

  return order;
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, transactionId = '', adminNote = '' } = req.body;

    const validStatuses = ['pending', 'submitted', 'paid', 'failed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid payment status',
      });
    }

    const order = await findOrderByAnyId(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    if (!order.paymentMethod) {
      order.paymentMethod = {};
    }

    order.paymentMethod.status = status;

    if (transactionId) {
      order.paymentMethod.transactionId = transactionId;
    }

    if (status === 'paid') {
      const paidDate = new Date();

      order.isPaid = true;
      order.paidAt = paidDate;
      order.paymentMethod.paidAt = paidDate;

      order.paymentResult = {
        id: transactionId || order.paymentMethod.transactionId || order.orderId,
        status: 'paid',
        update_time: paidDate.toISOString(),
        email_address: order.shippingAddress?.email || '',
      };

      if (order.manualPayment) {
        order.manualPayment.status = 'verified';
      }
    } else {
      order.isPaid = false;
      order.paidAt = null;
      order.paymentMethod.paidAt = null;

      order.paymentResult = {
        ...(order.paymentResult || {}),
        status,
        update_time: new Date().toISOString(),
      };

      if (order.manualPayment) {
        if (status === 'submitted') order.manualPayment.status = 'submitted';
        if (status === 'failed') order.manualPayment.status = 'rejected';
        if (status === 'pending') order.manualPayment.status = 'submitted';
      }
    }

    if (order.manualPayment && adminNote) {
      order.manualPayment.adminNote = adminNote;
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Payment status update failed',
    });
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
  resetDeliveryStatus,
  updatePaymentStatus,
  
};