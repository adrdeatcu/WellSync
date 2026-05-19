import express, { Request, Response } from 'express';
import { getDailyCoachAdvice, CoachContext } from '../services/coachService.js';
import { loadCoachContext } from '../services/coachDataService.js';

const router = express.Router();

router.post('/daily', async (req: Request, res: Response) => {
  try {
    const { userId, mood, sleepHours, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const dbContext = await loadCoachContext(userId);

    const context: CoachContext = {
      ...dbContext,
      mood,
      sleepHours,
      notes,
    };

    const advice = await getDailyCoachAdvice(userId, context);

    res.json(advice);
  } catch (error: any) {
    console.error('Error in /api/coach/daily:', error);
    res.status(500).json({ error: 'Failed to generate coach advice' });
  }
});

export default router;