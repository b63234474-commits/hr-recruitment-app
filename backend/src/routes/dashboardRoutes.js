import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

router.use(protect);
router.get('/stats', authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager'), getDashboardStats);

export default router;
