import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getStepsHistory,
  getHeartRateHistory,
} from '../controllers/historyController.js';

const router = express.Router();

// GET /api/history/steps?days=7
router.get('/history/steps', requireAuth, getStepsHistory);

// GET /api/history/heart-rate?days=7
router.get('/history/heart-rate', requireAuth, getHeartRateHistory);

export default router;