import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadResume,
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  matchCandidate,
  getPipelineStatuses,
  updateCandidateStatus,
  deleteCandidate,
} from '../controllers/candidateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    // Preserve original filename - sanitize it to remove spaces and special chars
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, sanitized);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

router.use(protect);

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/statuses', getPipelineStatuses);
router.route('/').get(getCandidates).post(authorize('Admin', 'HR', 'Recruiter'), createCandidate);
router
  .route('/:id')
  .get(getCandidateById)
  .put(authorize('Admin', 'HR', 'Recruiter'), updateCandidate)
  .delete(authorize('Admin', 'HR', 'Recruiter'), deleteCandidate);
router.post('/:id/match', authorize('Admin', 'HR', 'Recruiter'), matchCandidate);
router.patch('/:id/status', authorize('Admin', 'HR', 'Recruiter'), updateCandidateStatus);

export default router;
