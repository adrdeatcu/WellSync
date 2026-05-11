import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getGoals, putGoals } from '../controllers/goalsController.js';

const router = Router();

router.get('/goals', requireAuth, getGoals);
router.put('/goals', requireAuth, putGoals);

export default router;