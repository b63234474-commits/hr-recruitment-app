import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import {
  getMatchingCandidates,
  getCandidateMatch,
  saveCandidateMatch,
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getJobs).post(authorize('Admin', 'HR', 'Recruiter'), createJob);
router.route('/:id/match-candidates').get(authorize('Admin', 'HR', 'Recruiter'), getMatchingCandidates);
router.route('/:id/candidates/:candidateId/match')
  .get(authorize('Admin', 'HR', 'Recruiter'), getCandidateMatch)
  .post(authorize('Admin', 'HR', 'Recruiter'), saveCandidateMatch);
router
  .route('/:id')
  .get(getJobById)
  .put(authorize('Admin', 'HR', 'Recruiter'), updateJob)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteJob);

export default router;
