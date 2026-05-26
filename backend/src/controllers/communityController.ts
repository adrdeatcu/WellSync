import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createActivity,
  listPublicActivities,
  listMyActivities,
  joinActivity,
  leaveActivity,
  type CreateActivityInput,
  listActivityMessages,
  createActivityMessage,
} from '../services/communityService.js';

export async function postActivity(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body as CreateActivityInput;

    if (!body.title || !body.city || !body.start_time_utc || !body.end_time_utc) {
      return res.status(400).json({
        error: 'title, city, start_time_utc and end_time_utc are required',
      });
    }

    const start = new Date(body.start_time_utc);
    const end = new Date(body.end_time_utc);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: 'Invalid start/end times' });
    }

    const activity = await createActivity(userId, body);
    return res.status(201).json({ activity });
  } catch (err) {
    console.error('Error in postActivity:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getActivities(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawCity = req.query.city;
    const rawFrom = req.query.from;

    const city = typeof rawCity === 'string' ? rawCity : undefined;
    const from = typeof rawFrom === 'string' ? rawFrom : undefined;

    const activities = await listPublicActivities({
      userId,
      city,
      fromTimeUtc: from,
    });

    return res.status(200).json({ activities });
  } catch (err) {
    console.error('Error in getActivities:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyActivities(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activities = await listMyActivities(userId);
    return res.status(200).json({ activities });
  } catch (err) {
    console.error('Error in getMyActivities:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postJoinActivity(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawId = req.params.id;
    const activityId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity id is required' });
    }

    await joinActivity(userId, activityId);
    return res.status(200).json({ status: 'joined' });
  } catch (err) {
    console.error('Error in postJoinActivity:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postLeaveActivity(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawId = req.params.id;
    const activityId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity id is required' });
    }

    await leaveActivity(userId, activityId);
    return res.status(200).json({ status: 'left' });
  } catch (err) {
    console.error('Error in postLeaveActivity:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getActivityMessages(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawId = req.params.id;
    const activityId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity id is required' });
    }

    try {
      const messages = await listActivityMessages(userId, activityId);
      return res.status(200).json({ messages });
    } catch (err: any) {
      if (err && (err as any).code === 'NOT_MEMBER') {
        return res
          .status(403)
          .json({ error: 'You must join this activity to view messages.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error in getActivityMessages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postActivityMessage(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawId = req.params.id;
    const activityId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity id is required' });
    }

    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ error: 'content is required and cannot be empty' });
    }

    try {
      const message = await createActivityMessage(userId, activityId, content);
      return res.status(201).json({ message });
    } catch (err: any) {
      if (err && (err as any).code === 'NOT_MEMBER') {
        return res
          .status(403)
          .json({ error: 'You must join this activity to send messages.' });
      }
      if (err && (err as any).code === 'EMPTY_MESSAGE') {
        return res
          .status(400)
          .json({ error: 'Message content cannot be empty.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error in postActivityMessage:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}