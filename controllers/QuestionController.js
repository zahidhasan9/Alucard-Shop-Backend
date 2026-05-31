// import Question from '../models/QuestionModel.js';

// export const createQuestion = async (req, res) => {
//   try {
//     const { product, question } = req.body;
//     if (!product || !question) return res.status(400).json({ message: 'Product and question are required.' });

//     const item = await Question.create({ product, question, user: req.user._id });
//     await item.populate('user', 'firstName lastName');
//     res.status(201).json({ success: true, question: item });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const getProductQuestions = async (req, res) => {
//   const questions = await Question.find({ product: req.params.productId, isApproved: true })
//     .sort({ createdAt: -1 })
//     .populate('user', 'firstName lastName')
//     .populate('answers.user', 'firstName lastName role');
//   res.json({ success: true, questions });
// };

// export const answerQuestion = async (req, res) => {
//   try {
//     const { answer } = req.body;
//     const question = await Question.findById(req.params.id);
//     if (!question) return res.status(404).json({ message: 'Question not found.' });

//     question.answers.push({
//       user: req.user._id,
//       answer,
//       isAdminAnswer: req.user.role === 'admin',
//     });
//     await question.save();
//     await question.populate('answers.user', 'firstName lastName role');
//     res.json({ success: true, question });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const deleteQuestion = async (req, res) => {
//   const question = await Question.findById(req.params.id);
//   if (!question) return res.status(404).json({ message: 'Question not found.' });
//   const isOwner = question.user.toString() === req.user._id.toString();
//   if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not allowed.' });
//   await question.deleteOne();
//   res.json({ success: true, message: 'Question deleted.' });
// };














import Question from '../models/QuestionModel.js';

const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];

const populateQuestion = async (id) => {
  return Question.findById(id)
    .populate('user', 'firstName lastName email phone role')
    .populate('product', 'name slug thumbnail')
    .populate('answers.user', 'firstName lastName role');
};

export const createQuestion = async (req, res) => {
  try {
    const { product, question } = req.body;

    if (!product || !question?.trim()) {
      return res.status(400).json({
        message: 'Product and question are required.',
      });
    }

    const item = await Question.create({
      product,
      question: question.trim(),
      user: req.user._id,
      status: 'pending',
      isApproved: false,
      isPublic: false,
    });

    const populated = await populateQuestion(item._id);

    res.status(201).json({
      success: true,
      message: 'Question submitted. It will appear after admin approval.',
      question: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create question.',
    });
  }
};

export const getProductQuestions = async (req, res) => {
  try {
    const questions = await Question.find({
      product: req.params.productId,
      status: 'approved',
      isApproved: true,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName')
      .populate('answers.user', 'firstName lastName role');

    res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch questions.',
    });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({
        message: 'Answer is required.',
      });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    question.answers.push({
      user: req.user._id,
      answer: answer.trim(),
      isAdminAnswer: true,
      isApproved: true,
    });

    question.status = 'approved';
    question.isApproved = true;
    question.isPublic = true;

    await question.save();

    const populated = await populateQuestion(question._id);

    res.status(200).json({
      success: true,
      message: 'Answer saved.',
      question: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to answer question.',
    });
  }
};

export const getAdminQuestions = async (req, res) => {
  try {
    const {
      status = 'all',
      answered = 'all',
      search = '',
    } = req.query;

    const match = {};

    if (status !== 'all') match.status = status;

    if (search.trim()) {
      match.question = { $regex: search.trim(), $options: 'i' };
    }

    if (answered === 'yes') {
      match['answers.0'] = { $exists: true };
    }

    if (answered === 'no') {
      match.answers = { $size: 0 };
    }

    const questions = await Question.find(match)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone role')
      .populate('product', 'name slug thumbnail')
      .populate('answers.user', 'firstName lastName role');

    const stats = {
      total: await Question.countDocuments({}),
      pending: await Question.countDocuments({ status: 'pending' }),
      approved: await Question.countDocuments({ status: 'approved' }),
      hidden: await Question.countDocuments({ status: 'hidden' }),
      rejected: await Question.countDocuments({ status: 'rejected' }),
      unanswered: await Question.countDocuments({ answers: { $size: 0 } }),
    };

    res.status(200).json({
      success: true,
      questions,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin questions.',
    });
  }
};

export const getAdminQuestionById = async (req, res) => {
  try {
    const question = await populateQuestion(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch question.',
    });
  }
};

export const updateQuestionStatus = async (req, res) => {
  try {
    const { status, adminNote = '' } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid question status.',
      });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    question.status = status;
    question.isApproved = status === 'approved';
    question.isPublic = status === 'approved';
    question.adminNote = adminNote;

    await question.save();

    const populated = await populateQuestion(question._id);

    res.status(200).json({
      success: true,
      message: 'Question status updated.',
      question: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update question status.',
    });
  }
};

export const updateAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;
    const { answer } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({
        message: 'Answer is required.',
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    const targetAnswer = question.answers.id(answerId);

    if (!targetAnswer) {
      return res.status(404).json({
        message: 'Answer not found.',
      });
    }

    targetAnswer.answer = answer.trim();

    await question.save();

    const populated = await populateQuestion(question._id);

    res.status(200).json({
      success: true,
      message: 'Answer updated.',
      question: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update answer.',
    });
  }
};

export const deleteAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    question.answers.pull(answerId);
    await question.save();

    const populated = await populateQuestion(question._id);

    res.status(200).json({
      success: true,
      message: 'Answer deleted.',
      question: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete answer.',
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        message: 'Question not found.',
      });
    }

    const isOwner = question.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not allowed.',
      });
    }

    await question.deleteOne();

    res.status(200).json({
      success: true,
      id: req.params.id,
      message: 'Question deleted.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete question.',
    });
  }
};