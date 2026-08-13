import { Router } from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
} from '../controllers/assessmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getAssessments).post(authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager', 'Interviewer'), createAssessment);
router
  .route('/:id')
  .get(getAssessmentById)
  .put(authorize('Admin', 'HR', 'Recruiter', 'Hiring Manager', 'Interviewer'), updateAssessment)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteAssessment);

export default router;
