import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getProfileForUser,
  updateProfileForUser,
  type UpdateProfileInput,
} from '../services/profileService.js';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await getProfileForUser(userId);

    if (!profile) {
      return res.status(200).json({
        hasProfile: false,
        profile: null,
      });
    }

    return res.status(200).json({
      hasProfile: true,
      profile,
    });
  } catch (err) {
    console.error('Error in getProfile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function putProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body as UpdateProfileInput;

    // Basic validation for numeric fields if present
    if (
      body.age !== undefined &&
      body.age !== null &&
      typeof body.age !== 'number'
    ) {
      return res.status(400).json({ error: 'age must be a number or null' });
    }

    if (
      body.height_cm !== undefined &&
      body.height_cm !== null &&
      typeof body.height_cm !== 'number'
    ) {
      return res
        .status(400)
        .json({ error: 'height_cm must be a number or null' });
    }

    if (
      body.weight_kg !== undefined &&
      body.weight_kg !== null &&
      typeof body.weight_kg !== 'number'
    ) {
      return res
        .status(400)
        .json({ error: 'weight_kg must be a number or null' });
    }

    if (
      body.step_goal_per_day !== undefined &&
      typeof body.step_goal_per_day !== 'number'
    ) {
      return res
        .status(400)
        .json({ error: 'step_goal_per_day must be a number' });
    }

    const updated = await updateProfileForUser(userId, body);

    return res.status(200).json({ profile: updated });
  } catch (err) {
    console.error('Error in putProfile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}