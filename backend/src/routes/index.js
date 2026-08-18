import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import authRoutes from './authRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import candidateRoutes from './candidateRoutes.js';
import interviewRoutes from './interviewRoutes.js';
import jobRoutes from './jobRoutes.js';
import offerRoutes from './offerRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import userRoutes from './userRoutes.js';
import partnerRoutes from './partnerRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import emailRoutes from './emailRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import activityRoutes from './activityRoutes.js';
import { protect } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import { PIPELINE_STATUSES } from '../config/pipelineStatuses.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'HR Recruitment API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);
router.use('/partners', partnerRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/interviews', interviewRoutes);
router.use('/offers', offerRoutes);
router.use('/employees', employeeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/emails', emailRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/activities', activityRoutes);

export default router;
