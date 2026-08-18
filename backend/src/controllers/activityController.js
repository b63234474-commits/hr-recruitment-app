import asyncHandler from '../middleware/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { getCandidateActivities, getActivitySummary } from '../utils/activityService.js';
import Candidate from '../models/Candidate.js';
import CandidateActivity from '../models/CandidateActivity.js';

/**
 * Get activities for a specific candidate
 * GET /api/candidates/:candidateId/activities
 */
export const getCandidateTimeline = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const { page = 1, limit = 20, type } = req.query;

  // Verify candidate exists
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const { activities, pagination } = await getCandidateActivities(
    candidateId,
    Number(page),
    Number(limit),
    type
  );

  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination,
    },
  });
});

/**
 * Get activity summary across all candidates
 * GET /api/activities/summary
 */
export const getActivitySummaryHandler = asyncHandler(async (req, res) => {
  const summary = await getActivitySummary();

  res.status(200).json({
    success: true,
    data: {
      summary,
    },
  });
});

/**
 * Get all activity types
 * GET /api/activities/types
 */
export const getActivityTypes = asyncHandler(async (req, res) => {
  const types = [
    { value: 'APPLICATION', label: 'Application' },
    { value: 'RESUME_UPLOADED', label: 'Resume Uploaded' },
    { value: 'RESUME_PARSED', label: 'Resume Parsed' },
    { value: 'SHORTLISTED', label: 'Shortlisted' },
    { value: 'STATUS_CHANGED', label: 'Status Changed' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
    { value: 'INTERVIEW_RESCHEDULED', label: 'Interview Rescheduled' },
    { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed' },
    { value: 'INTERVIEW_CANCELLED', label: 'Interview Cancelled' },
    { value: 'FEEDBACK_SUBMITTED', label: 'Feedback Submitted' },
    { value: 'SELECTED', label: 'Selected' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'OFFER_CREATED', label: 'Offer Created' },
    { value: 'OFFER_SENT', label: 'Offer Sent' },
    { value: 'OFFER_ACCEPTED', label: 'Offer Accepted' },
    { value: 'OFFER_REJECTED', label: 'Offer Rejected' },
    { value: 'ONBOARDING_STARTED', label: 'Onboarding Started' },
    { value: 'ONBOARDING_COMPLETED', label: 'Onboarding Completed' },
    { value: 'EMAIL_SENT', label: 'Email Sent' },
    { value: 'NOTE_ADDED', label: 'Note Added' },
    { value: 'TAG_ADDED', label: 'Tag Added' },
    { value: 'TAG_REMOVED', label: 'Tag Removed' },
    { value: 'CANDIDATE_UPDATED', label: 'Candidate Updated' },
    { value: 'CANDIDATE_CREATED', label: 'Candidate Created' },
  ];

  res.status(200).json({
    success: true,
    data: { types },
  });
});
