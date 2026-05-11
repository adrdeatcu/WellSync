import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getTodayStatsForUser } from '../services/statsService.js';

export async function getTodayStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await getTodayStatsForUser(userId);

    if (!stats) {
      return res.status(200).json({ hasData: false, stats: null });
    }

    return res.status(200).json({
      hasData: true,
      stats
    });
  } catch (err) {
    console.error('Error in getTodayStats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}