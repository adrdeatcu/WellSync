import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getGoalsForUser,
  updateGoalsForUser,
  type UpdateGoalsInput
} from '../services/goalsService.js';

export async function getGoals(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goals = await getGoalsForUser(userId);

    if (!goals) {
      return res.status(200).json({
        hasProfile: false,
        goals: null
      });
    }

    return res.status(200).json({
      hasProfile: true,
      goals
    });
  } catch (err) {
    console.error('Error in getGoals:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function putGoals(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body as UpdateGoalsInput;

    if (
      body.step_goal_per_day !== undefined &&
      typeof body.step_goal_per_day !== 'number'
    ) {
      return res.status(400).json({ error: 'step_goal_per_day must be a number' });
    }

    const updated = await updateGoalsForUser(userId, body);
    return res.status(200).json({ goals: updated });
  } catch (err) {
    console.error('Error in putGoals:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}