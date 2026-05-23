import Question from '../models/QuestionModel.js';

export const createQuestion = async (req, res) => {
  try {
    const { product, question } = req.body;
    if (!product || !question) return res.status(400).json({ message: 'Product and question are required.' });

    const item = await Question.create({ product, question, user: req.user._id });
    await item.populate('user', 'firstName lastName');
    res.status(201).json({ success: true, question: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductQuestions = async (req, res) => {
  const questions = await Question.find({ product: req.params.productId, isApproved: true })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName')
    .populate('answers.user', 'firstName lastName role');
  res.json({ success: true, questions });
};

export const answerQuestion = async (req, res) => {
  try {
    const { answer } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    question.answers.push({
      user: req.user._id,
      answer,
      isAdminAnswer: req.user.role === 'admin',
    });
    await question.save();
    await question.populate('answers.user', 'firstName lastName role');
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found.' });
  const isOwner = question.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed.' });
  await question.deleteOne();
  res.json({ success: true, message: 'Question deleted.' });
};
