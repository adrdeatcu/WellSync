import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  searchUsersByNameOrUsername,
  getFriendsOverview,
  sendFriendRequest,
  acceptFriendRequest,
} from '../services/friendsService.js';

export async function searchFriends(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query } = req.body as { query?: string };
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    const results = await searchUsersByNameOrUsername(userId, query.trim());
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Error in searchFriends:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFriends(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const overview = await getFriendsOverview(userId);
    return res.status(200).json(overview);
  } catch (err) {
    console.error('Error in getFriends:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function postFriendRequest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { target_user_id } = req.body as { target_user_id?: string };
    if (!target_user_id) {
      return res
        .status(400)
        .json({ error: 'target_user_id is required' });
    }

    await sendFriendRequest(userId, target_user_id);
    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('Error in postFriendRequest:', err);
    return res
      .status(500)
      .json({ error: err.message ?? 'Internal server error' });
  }
}

export async function postAcceptFriend(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { other_user_id } = req.body as { other_user_id?: string };
    if (!other_user_id) {
      return res
        .status(400)
        .json({ error: 'other_user_id is required' });
    }

    await acceptFriendRequest(userId, other_user_id);
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Error in postAcceptFriend:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}