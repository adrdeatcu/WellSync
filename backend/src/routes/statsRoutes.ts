import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTodayStats } from '../controllers/statsController.js';

const router = Router();

router.get('/stats/today', requireAuth, getTodayStats);

export default router;