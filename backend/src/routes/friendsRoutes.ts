import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getFriends,
  searchFriends,
  postFriendRequest,
  postAcceptFriend,
} from '../controllers/friendsController.js';

const router = Router();

router.use(requireAuth);

router.get('/friends', getFriends);
router.post('/friends/search', searchFriends);
router.post('/friends/requests', postFriendRequest);
router.post('/friends/accept', postAcceptFriend);

export default router;