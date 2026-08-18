import { Router } from 'express';
import { sendCandidateEmail, getCandidateEmailHistory } from '../controllers/emailController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/send', sendCandidateEmail);
router.get('/candidate/:candidateId', getCandidateEmailHistory);

export default router;
