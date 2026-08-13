import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getReports } from '../controllers/reportController.js';

const router = Router();

router.use(protect);
router.get('/', authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager'), getReports);

export default router;
