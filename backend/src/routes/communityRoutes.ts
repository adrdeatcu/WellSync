import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  postActivity,
  getActivities,
  getMyActivities,
  postJoinActivity,
  postLeaveActivity,
} from '../controllers/communityController.js';

const router = Router();

router.use(requireAuth);

router.post('/activities', postActivity);
router.get('/activities', getActivities);
router.get('/activities/mine', getMyActivities);
router.post('/activities/:id/join', postJoinActivity);
router.post('/activities/:id/leave', postLeaveActivity);

export default router;