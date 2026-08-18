import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('Admin', 'HR'), updateSettings);

export default router;
