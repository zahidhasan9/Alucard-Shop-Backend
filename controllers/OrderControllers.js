import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import { nanoid } from 'nanoid';

// @desc     Create new order
// @method   POST
// @endpoint /api/v1/orders
// @access   Private
const addOrderItems = async (req, res, next) => {
  try {
    const {
      cartItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    if (!cartItems || cartItems.length === 0) {
      res.statusCode = 400;
      throw new Error('No order items.');
    }

    const orderId = 'ORD-' + nanoid(8); // ORD-A1B2C3D4
    const tracking = [
      {
        status: 'pending',
        message: 'Your order has been placed and is now pending.',
        date: new Date(),
      },
    ];

    const order = new Order({
      user: req.user._id,
      orderItems: cartItems.map(item => ({
        ...item,
        product: item._id,
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderId,
      tracking: tracking,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

// @desc     Get logged-in user orders
// @method   GET
// @endpoint /api/v1/orders/my-orders
// @access   Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });

    if (!orders || orders.length === 0) {
      res.statusCode = 404;
      throw new Error('No orders found for the logged-in user.');
    }

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc     Get order by ID
// @method   GET
// @endpoint /api/v1/orders/:id
// @access   Private
const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // fetch by _id
    // const order = await Order.findById(orderId).populate('user', 'firstName lastName email');
    const order = await Order.findOne({ orderId }).populate(
      'user',
      'firstName lastName phone email'
    );
    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc     Update order to paid
// @method   PUT
// @endpoint /api/v1/orders/:id/pay
// @access   Private
const updateOrderToPaid = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.updateTime,
      email_address: req.body.email,
    };

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc     Update order to delivered
// @method   PUT
// @endpoint /api/v1/orders/:id/deliver
// @access   Private/Admin
const updateOrderToDeliver = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      res.statusCode = 404;
      throw new Error('Order not found!');
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();

    const updatedDeliver = await order.save();

    res.status(200).json(updatedDeliver);
  } catch (error) {
    next(error);
  }
};

// @desc     Get all orders
// @method   GET
// @endpoint /api/v1/orders
// @access   Private/Admin
const getOrders = async (req, res, next) => {
  try {
    const maxLimit = 15;
    const limit = Number(req.query.limit) || maxLimit;
    const skip = Number(req.query.skip) || 0;
    const search = req.query.search || '';

    let userIds = [];
    if (search) {
      const regex = new RegExp(search, 'i'); // case‑insensitive
      userIds = await User.find({ firstName: regex }).distinct('_id');
    }
    const regex = new RegExp(search, 'i');
    const filter = search ? { $or: [{ orderId: regex }, { user: { $in: userIds } }] } : {};

    const total = await Order.countDocuments(filter);
    const maxSkip = total ? total - 1 : 0;

    const orders = await Order.find(filter)
      .limit(limit > maxLimit ? maxLimit : limit)
      .skip(skip > maxSkip ? maxSkip : skip < 0 ? 0 : skip)
      .populate('user', 'id firstName');

    if (!orders || orders.length === 0) {
      res.statusCode = 404;
      throw new Error('Orders not found!');
    }
    res.status(200).json({
      orders,
      total,
      maxLimit,
      maxSkip,
      filterUsed: filter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc     Update order delivery status
// @method   PUT
// @endpoint /api/v1/orders/:id/delivery-status
// @access   Private/Admin
const updateOrderDeliveryStatus = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found!');
    }

    // validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid delivery status!');
    }

    order.deliveryStatus = status;

    // If delivered, set deliveredAt
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prevent going backward in status
    const currentIndex = validStatuses.indexOf(order.Delivery);
    const newIndex = validStatuses.indexOf(status);
    if (newIndex < currentIndex) {
      return res.status(400).json({ message: 'Cannot update to previous status' });
    }

    // Prepare status messages
    const messages = {
      pending: 'Your order is now pending.',
      confirmed: 'Your order has been confirmed.',
      shipped: 'Your order has been shipped.',
      delivered: 'Your order has been delivered.',
    };

    // Check last tracking entry to avoid duplicates
    const lastTracking = order.tracking[order.tracking.length - 1];

    if (!lastTracking || lastTracking.status !== status) {
      order.tracking.push({
        status,
        message: messages[status],
        date: new Date(),
      });
    }

    // Update order status and deliveredAt if delivered
    order.Delivery = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// Optimize seearch
// export const getOrders = async (req, res, next) => {
//   try {
//     const {
//       limit  = 15,
//       skip   = 0,
//       search = '',
//     } = req.query;

//     const regex = new RegExp(search, 'i');          // case‑insensitive
//     const base  = search ? { orderId: regex } : {}; // orderId ফিল্টার (ঐচ্ছিক)

//     let orders = await Order.find(base)
//       .limit(Math.min(+limit, 15))
//       .skip(Math.max(+skip, 0))
//       .populate({
//         path  : 'user',
//         select: 'id firstName',
//         match : { firstName: regex },               // firstName ফিল্টার
//       });

//     if (search) orders = orders.filter(o => o.user); // user না‑ম্যাচ হলে বাদ

//     if (!orders.length) return res.status(404).json({ message: 'Orders not found!' });
//     res.json(orders);
//   } catch (err) { next(err); }
// };

// GET /api/orders/last   (last oder view for order sucess page)
const getLastOrder = async (req, res) => {
  const order = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(1);

  if (!order || order.length === 0) {
    return res.status(404).json({ message: 'No orders found' });
  }

  res.status(200).json(order[0]);
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('orderId', orderId);

    const deleted = await Order.findOneAndDelete(orderId);

    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  updateOrderDeliveryStatus,
  updateDeliveryStatus,
};
