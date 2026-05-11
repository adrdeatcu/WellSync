import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { upsertMeasurementsForUser } from '../services/measurementsService.js';
import type { IncomingPerMinuteMeasurement } from '../types/measurements.js';

export async function postMeasurements(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { measurements } = req.body as {
      measurements?: IncomingPerMinuteMeasurement[];
    };

    if (!Array.isArray(measurements)) {
      return res.status(400).json({ error: 'measurements must be an array' });
    }

    await upsertMeasurementsForUser(userId, measurements);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error in postMeasurements:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}