import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { postMeasurements } from '../controllers/measurementsController.js';

const router = Router();

router.post('/measurements', requireAuth, postMeasurements);

export default router;