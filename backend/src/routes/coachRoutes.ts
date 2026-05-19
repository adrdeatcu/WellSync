import express, { Request, Response } from 'express';
import { getDailyCoachAdvice, CoachContext } from '../services/coachService.js';
import { loadCoachContext } from '../services/coachDataService.js';

const router = express.Router();

router.post('/daily', async (req: Request, res: Response) => {
  try {
    const { userId, mood, sleepHours, notes, question } = req.body as {
      userId: string;
      mood?: string;
      sleepHours?: number;
      notes?: string;
      question?: string;
    };

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const dbContext = await loadCoachContext(userId);

    const context: CoachContext = {
      ...dbContext,
      mood,
      sleepHours,
      notes,
      question: question || undefined,
    };

    const mode: 'daily' | 'question' = question ? 'question' : 'daily';

    const advice = await getDailyCoachAdvice(userId, context, mode);

    res.json(advice);
  } catch (error: any) {
    console.error('Error in /api/coach/daily:', error);
    res.status(500).json({ error: 'Failed to generate coach advice' });
  }
});

export default router;