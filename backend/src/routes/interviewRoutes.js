import { Router } from 'express';
import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  addInterviewFeedback,
  getInterviewFeedback,
} from '../controllers/interviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getInterviews).post(authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager', 'Interviewer'), createInterview);
router
  .route('/:id')
  .get(getInterviewById)
  .put(authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager', 'Interviewer'), updateInterview)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteInterview);
router.post('/:id/feedback', authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager', 'Interviewer'), addInterviewFeedback);
router.get('/:id/feedback', getInterviewFeedback);

export default router;
