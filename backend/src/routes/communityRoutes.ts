import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  postActivity,
  getActivities,
  getMyActivities,
  postJoinActivity,
  postLeaveActivity,
  getActivityMessages,
  postActivityMessage,
  postInviteToActivity,
  getMyInvitations,
  postRespondInvitation,
  getActivityMembers,
  getMyActivityInvitationsForActivity,
  deleteActivity,
} from '../controllers/communityController.js';

const router = Router();

router.use(requireAuth);

router.post('/activities', postActivity);
router.get('/activities', getActivities);
router.get('/activities/mine', getMyActivities);
router.post('/activities/:id/join', postJoinActivity);
router.post('/activities/:id/leave', postLeaveActivity);
router.delete('/activities/:id', deleteActivity);

// Invitations
router.post('/activities/:id/invitations', postInviteToActivity);
router.get('/activities/invitations', getMyInvitations);
router.post(
  '/activities/invitations/:invitationId/respond',
  postRespondInvitation
);

// NEW: invite modal helpers
router.get('/activities/:id/members', getActivityMembers);
router.get(
  '/activities/:id/invitations/mine',
  getMyActivityInvitationsForActivity
);

// Activity messages routes
router.get('/activities/:id/messages', getActivityMessages);
router.post('/activities/:id/messages', postActivityMessage);

export default router;