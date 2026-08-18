import { Router } from 'express';
import {
  getCandidatesBySource,
  getCandidatesByStatus,
  getAnalyticsSummary,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/sources', protect, getCandidatesBySource);
router.get('/statuses', protect, getCandidatesByStatus);
router.get('/summary', protect, getAnalyticsSummary);

export default router;
