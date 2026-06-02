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
  inviteFriendToActivity,
  listInvitationsForUser,
  respondToInvitation,
  listMembersForActivity,
  listInvitationsForActivityAndInviter,
  deleteActivityIfCreator,
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

/* ─────────────────── Invitations ─────────────────── */

export async function postInviteToActivity(
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

    const { invitee_user_id } = req.body as { invitee_user_id?: string };
    if (!invitee_user_id) {
      return res
        .status(400)
        .json({ error: 'invitee_user_id is required' });
    }

    try {
      await inviteFriendToActivity(userId, activityId, invitee_user_id);
      return res.status(200).json({ status: 'invited' });
    } catch (err: any) {
      if (err && (err as any).code === 'SELF_INVITE') {
        return res.status(400).json({ error: 'Cannot invite yourself.' });
      }
      if (err && (err as any).code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Activity not found.' });
      }
      if (err && (err as any).code === 'NOT_MEMBER') {
        return res
          .status(403)
          .json({ error: 'Only members can invite others to this activity.' });
      }
      if (err && (err as any).code === 'NOT_FRIENDS') {
        return res
          .status(400)
          .json({ error: 'You can only invite friends to this activity.' });
      }
      if (err && (err as any).code === 'ALREADY_MEMBER') {
        return res
          .status(400)
          .json({ error: 'User is already a member of this activity.' });
      }
      console.error('Error in postInviteToActivity:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('Error in postInviteToActivity (outer):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyInvitations(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const statusParam = req.query.status;
    const status =
      typeof statusParam === 'string' && statusParam.length > 0
        ? (statusParam as any)
        : 'pending';

    const invitations = await listInvitationsForUser(userId, status);
    return res.status(200).json({ invitations });
  } catch (err) {
    console.error('Error in getMyInvitations:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postRespondInvitation(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawId = req.params.invitationId;
    const invitationIdStr = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!invitationIdStr) {
      return res.status(400).json({ error: 'Invitation id is required' });
    }

    const invitationId = Number(invitationIdStr);
    if (Number.isNaN(invitationId)) {
      return res
        .status(400)
        .json({ error: 'Invitation id must be a number' });
    }

    const { decision } = req.body as { decision?: 'accept' | 'decline' };
    if (decision !== 'accept' && decision !== 'decline') {
      return res
        .status(400)
        .json({ error: "decision must be either 'accept' or 'decline'" });
    }

    try {
      await respondToInvitation(userId, invitationId, decision);
      return res.status(200).json({ status: 'ok' });
    } catch (err: any) {
      if (err && (err as any).code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Invitation not found.' });
      }
      if (err && (err as any).code === 'FORBIDDEN') {
        return res
          .status(403)
          .json({ error: 'You cannot respond to this invitation.' });
      }
      console.error('Error in postRespondInvitation:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('Error in postRespondInvitation (outer):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getActivityMembers(
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

    const members = await listMembersForActivity(activityId);
    return res.status(200).json({ members });
  } catch (err) {
    console.error('Error in getActivityMembers:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyActivityInvitationsForActivity(
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

    const invitations = await listInvitationsForActivityAndInviter(
      activityId,
      userId
    );

    return res.status(200).json({ invitations });
  } catch (err) {
    console.error('Error in getMyActivityInvitationsForActivity:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─────────────────── Delete activity ─────────────────── */

export async function deleteActivity(
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
      await deleteActivityIfCreator(userId, activityId);
      return res.status(200).json({ status: 'deleted' });
    } catch (err: any) {
      if (err && (err as any).code === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Activity not found.' });
      }
      if (err && (err as any).code === 'FORBIDDEN') {
        return res
          .status(403)
          .json({ error: 'Only the creator can delete this activity.' });
      }
      console.error('Error in deleteActivity:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('Error in deleteActivity (outer):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}