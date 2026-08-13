import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  updateOfferStatus,
  generateOfferPdfFile,
  deleteOffer,
} from '../controllers/offerController.js';

const router = Router();
router.use(protect);
router.route('/').get(getOffers).post(authorize('Admin', 'HR', 'Recruiter'), createOffer);
router.get('/:id/pdf', generateOfferPdfFile);
router.patch('/:id/status', authorize('Admin', 'HR', 'Recruiter'), updateOfferStatus);
router.route('/:id')
  .get(getOfferById)
  .put(authorize('Admin', 'HR', 'Recruiter'), updateOffer)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteOffer);

export default router;
