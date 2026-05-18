import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getStepsHistoryForUser,
  getHeartRateHistoryForUser,
} from '../services/historyService.js';

export async function getStepsHistory(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const daysParam = req.query.days as string | undefined;
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    if (Number.isNaN(days) || days <= 0 || days > 90) {
      return res
        .status(400)
        .json({ error: 'days must be a number between 1 and 90' });
    }

    const history = await getStepsHistoryForUser(userId, days);
    return res.status(200).json({ days, history });
  } catch (err) {
    console.error('Error in getStepsHistory:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHeartRateHistory(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const daysParam = req.query.days as string | undefined;
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    if (Number.isNaN(days) || days <= 0 || days > 90) {
      return res
        .status(400)
        .json({ error: 'days must be a number between 1 and 90' });
    }

    const history = await getHeartRateHistoryForUser(userId, days);
    return res.status(200).json({ days, history });
  } catch (err) {
    console.error('Error in getHeartRateHistory:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}