import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getProfile,
  putProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, putProfile);

export default router;