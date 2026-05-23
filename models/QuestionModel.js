import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answer: { type: String, required: true, trim: true },
    isAdminAnswer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, trim: true },
    answers: [answerSchema],
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Question = mongoose.model('Question', questionSchema);
export default Question;
