import { Router } from 'express';
import {
  createPartner,
  getPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
} from '../controllers/partnerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.route('/').get(getPartners).post(authorize('Admin', 'HR', 'Recruiter'), createPartner);
router
  .route('/:id')
  .get(getPartnerById)
  .put(authorize('Admin', 'HR', 'Recruiter'), updatePartner)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deletePartner);

export default router;
