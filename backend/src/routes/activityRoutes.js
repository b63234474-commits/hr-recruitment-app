import { Router } from 'express';
import {
  getCandidateTimeline,
  getActivitySummaryHandler,
  getActivityTypes,
} from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Get activities for a specific candidate
router.get('/candidates/:candidateId/activities', protect, getCandidateTimeline);

// Get activity summary
router.get('/summary', protect, getActivitySummaryHandler);

// Get all activity types
router.get('/types', protect, getActivityTypes);

export default router;
