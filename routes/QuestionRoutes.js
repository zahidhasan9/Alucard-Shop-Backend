// import express from 'express';
// import { createQuestion, getProductQuestions, answerQuestion, deleteQuestion } from '../controllers/QuestionController.js';
// import { protect } from '../middlewares/authMiddleware.js';

// const router = express.Router();

// router.post('/', protect, createQuestion);
// router.get('/product/:productId', getProductQuestions);
// router.post('/:id/answer', protect, answerQuestion);
// router.delete('/:id', protect, deleteQuestion);

// export default router;




import express from 'express';
import {
  createQuestion,
  getProductQuestions,
  answerQuestion,
  deleteQuestion,
  getAdminQuestions,
  getAdminQuestionById,
  updateQuestionStatus,
  updateAnswer,
  deleteAnswer,
} from '../controllers/QuestionController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, admin, getAdminQuestions);
router.get('/admin/:id', protect, admin, getAdminQuestionById);
router.patch('/admin/:id/status', protect, admin, updateQuestionStatus);
router.post('/admin/:id/answer', protect, admin, answerQuestion);
router.put('/admin/:questionId/answer/:answerId', protect, admin, updateAnswer);
router.delete(
  '/admin/:questionId/answer/:answerId',
  protect,
  admin,
  deleteAnswer
);
router.delete('/admin/:id', protect, admin, deleteQuestion);

router.post('/', protect, createQuestion);
router.get('/product/:productId', getProductQuestions);

// Keep this only for old frontend compatibility.
// Better admin/public future usage: /product/:productId
router.post('/:id/answer', protect, admin, answerQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;