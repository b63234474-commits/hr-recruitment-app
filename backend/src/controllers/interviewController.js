import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import Assessment from '../models/Assessment.js';
import ActivityLog from '../models/ActivityLog.js';
import { PIPELINE_STATUSES } from '../config/pipelineStatuses.js';
import { sendInterviewInvitationEmail } from '../utils/emailService.js';

const resolveReferenceId = async (Model, reference) => {
  if (!reference) {
    return undefined;
  }

  if (mongoose.isValidObjectId(reference)) {
    const doc = await Model.findById(reference);
    return doc ? doc._id : undefined;
  }

  const byIdField = Model === Job ? { jobId: reference } : {};
  if (Object.keys(byIdField).length > 0) {
    const doc = await Model.findOne(byIdField);
    return doc ? doc._id : undefined;
  }

  return undefined;
};

const updateCandidatePipelineStatus = async (candidate, interviewStatus) => {
  const previousStatus = candidate.status;
  let nextStatus = previousStatus;

  if (interviewStatus === 'Scheduled') {
    nextStatus = 'Interview Scheduled';
  } else if (interviewStatus === 'Completed') {
    nextStatus = 'Interview Completed';
  }

  if (nextStatus !== previousStatus && PIPELINE_STATUSES.includes(nextStatus)) {
    candidate.status = nextStatus;
    await candidate.save();

    const activityLog = await ActivityLog.create({
      candidate: candidate._id,
      performedBy: null,
      fromStatus: previousStatus,
      toStatus: nextStatus,
      note: `Interview status updated to ${nextStatus}`,
    });

    candidate.activityLogs.push(activityLog._id);
    await candidate.save();
  }
};

export const createInterview = asyncHandler(async (req, res) => {
  const {
    candidate,
    job,
    assessment,
    interviewType,
    interviewer,
    interviewDate,
    startTime,
    endTime,
    meetingLink,
    location,
    notes,
    status,
  } = req.body;

  if (!candidate || !interviewType || !interviewDate) {
    throw new ApiError(400, 'Candidate, interview type, and interview date are required');
  }

  const candidateDoc = await Candidate.findById(candidate);
  if (!candidateDoc) {
    throw new ApiError(404, 'Candidate not found');
  }

  const resolvedJobId = job ? await resolveReferenceId(Job, job) : candidateDoc.appliedJob;
  const resolvedAssessmentId = assessment ? await resolveReferenceId(Assessment, assessment) : undefined;

  const interview = await Interview.create({
    candidate: candidateDoc._id,
    job: resolvedJobId,
    assessment: resolvedAssessmentId,
    interviewType,
    interviewer,
    interviewDate: new Date(interviewDate),
    startTime,
    endTime,
    meetingLink,
    location,
    notes,
    status: status || 'Scheduled',
  });

  await updateCandidatePipelineStatus(candidateDoc, interview.status);

  const jobDoc = resolvedJobId ? await Job.findById(resolvedJobId) : null;
  let emailResult = null;
  try {
    emailResult = await sendInterviewInvitationEmail({
      candidate: candidateDoc,
      job: jobDoc,
      interview,
    });
  } catch (err) {
    console.error('Failed to send interview invitation email:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Interview created successfully',
    data: { interview, email: emailResult },
  });
});

export const getInterviews = asyncHandler(async (req, res) => {
  const { search, candidate, job, interviewer, interviewType, status, date, limit } = req.query;
  const query = {};

  if (candidate && mongoose.isValidObjectId(candidate)) {
    query.candidate = candidate;
  }

  if (job) {
    const resolvedJob = await resolveReferenceId(Job, job);
    if (resolvedJob) query.job = resolvedJob;
  }

  if (interviewer) {
    query.interviewer = { $regex: interviewer, $options: 'i' };
  }

  if (interviewType) {
    query.interviewType = interviewType;
  }

  if (status) {
    query.status = status;
  }

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.interviewDate = { $gte: start, $lte: end };
  }

  if (search) {
    query.$or = [
      { interviewer: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { meetingLink: { $regex: search, $options: 'i' } },
    ];
  }

  let interviewQuery = Interview.find(query)
    .populate('candidate', 'firstName lastName status appliedJob')
    .populate('job', 'jobId jobTitle status')
    .populate('assessment', 'title status result')
    .sort({ interviewDate: 1 });

  if (limit && !Number.isNaN(Number(limit))) {
    interviewQuery = interviewQuery.limit(Number(limit));
  }

  const interviews = await interviewQuery;
  res.status(200).json({
    success: true,
    count: interviews.length,
    data: { interviews },
  });
});

export const getInterviewById = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate('candidate', 'firstName lastName status appliedJob')
    .populate('job', 'jobId jobTitle status')
    .populate('assessment', 'title status result');

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  res.status(200).json({
    success: true,
    data: { interview },
  });
});

export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  const {
    candidate,
    job,
    assessment,
    interviewType,
    interviewer,
    interviewDate,
    startTime,
    endTime,
    meetingLink,
    location,
    notes,
    status,
  } = req.body;

  if (candidate && mongoose.isValidObjectId(candidate)) {
    interview.candidate = candidate;
  }

  if (job) {
    const resolvedJobId = await resolveReferenceId(Job, job);
    interview.job = resolvedJobId || interview.job;
  }

  if (assessment) {
    const resolvedAssessmentId = await resolveReferenceId(Assessment, assessment);
    interview.assessment = resolvedAssessmentId || interview.assessment;
  }

  interview.interviewType = interviewType ?? interview.interviewType;
  interview.interviewer = interviewer ?? interview.interviewer;
  interview.interviewDate = interviewDate ? new Date(interviewDate) : interview.interviewDate;
  interview.startTime = startTime ?? interview.startTime;
  interview.endTime = endTime ?? interview.endTime;
  interview.meetingLink = meetingLink ?? interview.meetingLink;
  interview.location = location ?? interview.location;
  interview.notes = notes ?? interview.notes;
  interview.status = status ?? interview.status;

  await interview.save();

  const candidateDoc = await Candidate.findById(interview.candidate);
  if (candidateDoc) {
    await updateCandidatePipelineStatus(candidateDoc, interview.status);
  }

  res.status(200).json({
    success: true,
    message: 'Interview updated successfully',
    data: { interview },
  });
});

export const resendInterviewInvitation = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id).populate('candidate').populate('job');
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  const emailResult = await sendInterviewInvitationEmail({
    candidate: interview.candidate,
    job: interview.job,
    interview,
  });

  res.status(200).json({
    success: true,
    message: 'Interview invitation sent',
    data: { email: emailResult },
  });
});

export const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  await interview.deleteOne();
  res.status(200).json({
    success: true,
    message: 'Interview deleted successfully',
  });
});

export const addInterviewFeedback = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  const {
    technicalSkills,
    communication,
    problemSolving,
    experience,
    teamFit,
    overallRating,
    strengths,
    weaknesses,
    comments,
    recommendation,
  } = req.body;

  interview.feedback = {
    technicalSkills,
    communication,
    problemSolving,
    experience,
    teamFit,
    overallRating,
    strengths,
    weaknesses,
    comments,
    recommendation,
  };

  await interview.save();

  res.status(200).json({
    success: true,
    message: 'Feedback saved successfully',
    data: { feedback: interview.feedback },
  });
});

export const getInterviewFeedback = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  res.status(200).json({
    success: true,
    data: { feedback: interview.feedback || {} },
  });
});
