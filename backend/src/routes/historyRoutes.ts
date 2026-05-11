import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStepsHistory } from '../controllers/historyController.js';

const router = Router();

router.get('/history/steps', requireAuth, getStepsHistory);

export default router;