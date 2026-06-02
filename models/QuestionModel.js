import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },

    isAdminAnswer: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answers: [answerSchema],

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

    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

questionSchema.index({ question: 'text' });

const Question = mongoose.model('Question', questionSchema);

export default Question;