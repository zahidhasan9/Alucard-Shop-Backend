import express from 'express';
import { createQuestion, getProductQuestions, answerQuestion, deleteQuestion } from '../controllers/QuestionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createQuestion);
router.get('/product/:productId', getProductQuestions);
router.post('/:id/answer', protect, answerQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;
