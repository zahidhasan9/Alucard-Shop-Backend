import mongoose from 'mongoose';

const adminReplySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      default: '',
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    repliedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'hidden'],
      default: 'pending',
      index: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminReply: adminReplySchema,

    adminNote: {
      type: String,
      trim: true,
      default: '',
    },

    reportedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ comment: 'text' });

const Review = mongoose.model('Review', reviewSchema);

export default Review;