import Order from '../models/OrderModel.js';
import ReturnRequest from '../models/ReturnRequestModel.js';

const getUploadedImages = req => {
  if (!req.files?.length) return [];
  if (process.env.UPLOAD_METHOD === 'cloudinary') return req.files.map(file => file.path);
  return req.files.map(file => `/uploads/${file.filename}`);
};

export const createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason, note } = req.body;
    const order = await Order.findOne({ orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.Delivery !== 'delivered') return res.status(400).json({ message: 'Return request is allowed after delivery only.' });

    const deliveredAt = order.deliveredAt || order.updatedAt;
    const returnWindowMs = 7 * 24 * 60 * 60 * 1000;
    if (new Date() - new Date(deliveredAt) > returnWindowMs) {
      return res.status(400).json({ message: 'Return window expired.' });
    }

    const exists = await ReturnRequest.findOne({ order: order._id, user: req.user._id, status: { $ne: 'cancelled' } });
    if (exists) return res.status(400).json({ message: 'Return request already exists for this order.' });

    const request = await ReturnRequest.create({
      user: req.user._id,
      order: order._id,
      orderId: order.orderId,
      reason,
      note,
      images: getUploadedImages(req),
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReturnRequests = async (req, res) => {
  const requests = await ReturnRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('order');
  res.json({ success: true, requests });
};

export const getReturnRequests = async (req, res) => {
  const requests = await ReturnRequest.find()
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email phone')
    .populate('order');
  res.json({ success: true, requests });
};

export const updateReturnRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const request = await ReturnRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true, runValidators: true }
    );
    if (!request) return res.status(404).json({ message: 'Return request not found.' });
    res.json({ success: true, request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
