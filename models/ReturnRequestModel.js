import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderId: { type: String, required: true, index: true },
    reason: {
      type: String,
      enum: ['damaged', 'wrong_item', 'not_as_described', 'size_issue', 'other'],
      required: true,
    },
    note: { type: String, trim: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'received', 'refunded', 'cancelled'],
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
export default ReturnRequest;
