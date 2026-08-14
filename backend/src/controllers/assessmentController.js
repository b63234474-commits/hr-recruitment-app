import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import Assessment from '../models/Assessment.js';
import ActivityLog from '../models/ActivityLog.js';
import { PIPELINE_STATUSES } from '../config/pipelineStatuses.js';

const resolveJobReference = async (jobReference) => {
  if (!jobReference) {
    return undefined;
  }

  if (mongoose.isValidObjectId(jobReference)) {
    const job = await Job.findById(jobReference);
    return job ? job._id : undefined;
  }

  const jobByJobId = await Job.findOne({ jobId: jobReference });
  if (jobByJobId) {
    return jobByJobId._id;
  }

  const jobByTitle = await Job.findOne({ jobTitle: { $regex: `^${jobReference}$`, $options: 'i' } });
  return jobByTitle ? jobByTitle._id : undefined;
};

const buildAssessmentCandidateStatus = (candidate, result, newAssessmentStatus) => {
  const currentStatus = candidate.status;
  if (result === 'Pass') {
    return 'Interview Scheduled';
  }
  if (result === 'Fail') {
    return 'Rejected';
  }
  if (newAssessmentStatus === 'In Progress') {
    return 'Assessment';
  }
  return currentStatus;
};

export const createAssessment = asyncHandler(async (req, res) => {
  const {
    candidate: candidateId,
    job: jobReference,
    title,
    description,
    assessmentType,
    assignedTo,
    dueDate,
  } = req.body;

  if (!candidateId || !title) {
    throw new ApiError(400, 'Candidate and assessment title are required');
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const resolvedJobId = jobReference
    ? await resolveJobReference(jobReference)
    : candidate.appliedJob;

  const assessment = await Assessment.create({
    candidate: candidate._id,
    job: resolvedJobId,
    title,
    description,
    assessmentType,
    assignedBy: req.user._id,
    assignedTo,
    dueDate,
  });

  candidate.assessments.push(assessment._id);
  const previousStatus = candidate.status;
  if (previousStatus !== 'Assessment') {
    candidate.status = 'Assessment';
    await candidate.save();

    const activityLog = await ActivityLog.create({
      candidate: candidate._id,
      performedBy: req.user._id,
      fromStatus: previousStatus,
      toStatus: candidate.status,
      note: 'Assigned assessment and moved candidate to Assessment stage',
    });

    candidate.activityLogs.push(activityLog._id);
    await candidate.save();
  } else {
    await candidate.save();
  }

  res.status(201).json({
    success: true,
    message: 'Assessment created successfully',
    data: { assessment },
  });
});

export const getAssessments = asyncHandler(async (req, res) => {
  const { search, candidate: candidateRef, job: jobRef, status, assignedTo, result, limit } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { assignedTo: { $regex: search, $options: 'i' } },
    ];
  }

  if (candidateRef) {
    if (mongoose.isValidObjectId(candidateRef)) {
      query.candidate = candidateRef;
    }
  }

  if (jobRef) {
    const resolvedJobId = await resolveJobReference(jobRef);
    if (resolvedJobId) {
      query.job = resolvedJobId;
    }
  }

  if (status) {
    query.status = status;
  }

  if (assignedTo) {
    query.assignedTo = { $regex: assignedTo, $options: 'i' };
  }

  if (result) {
    query.result = result;
  }

  let assessmentQuery = Assessment.find(query)
    .populate('candidate', 'firstName lastName status appliedJob')
    .populate('job', 'jobId jobTitle status')
    .populate('assignedBy', 'firstName lastName role')
    .sort({ createdAt: -1 });

  if (limit && !Number.isNaN(Number(limit))) {
    assessmentQuery = assessmentQuery.limit(Number(limit));
  }

  const assessments = await assessmentQuery;

  res.status(200).json({
    success: true,
    count: assessments.length,
    data: { assessments },
  });
});

export const getAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('candidate', 'firstName lastName status appliedJob')
    .populate('job', 'jobId jobTitle status')
    .populate('assignedBy', 'firstName lastName role');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  res.status(200).json({
    success: true,
    data: { assessment },
  });
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  const {
    title,
    description,
    assessmentType,
    assignedTo,
    dueDate,
    status,
    score,
    result,
    feedback,
  } = req.body;

  assessment.title = title ?? assessment.title;
  assessment.description = description ?? assessment.description;
  assessment.assessmentType = assessmentType ?? assessment.assessmentType;
  assessment.assignedTo = assignedTo ?? assessment.assignedTo;
  assessment.dueDate = dueDate ? new Date(dueDate) : assessment.dueDate;
  assessment.status = status ?? assessment.status;
  assessment.score = score ?? assessment.score;
  assessment.result = result ?? assessment.result;
  assessment.feedback = feedback ?? assessment.feedback;

  if (status === 'Completed' && !assessment.completedAt) {
    assessment.completedAt = new Date();
  }

  if (status !== 'Completed') {
    assessment.completedAt = assessment.completedAt;
  }

  await assessment.save();

  const candidate = await Candidate.findById(assessment.candidate);
  if (candidate) {
    const previousStatus = candidate.status;
    const nextStatus = buildAssessmentCandidateStatus(candidate, assessment.result, assessment.status);

    if (nextStatus !== previousStatus) {
      candidate.status = nextStatus;
      await candidate.save();

      const activityLog = await ActivityLog.create({
        candidate: candidate._id,
        performedBy: req.user._id,
        fromStatus: previousStatus,
        toStatus: nextStatus,
        note: `Assessment updated: ${assessment.result || 'Result pending'}`,
      });

      candidate.activityLogs.push(activityLog._id);
      await candidate.save();
    }
  }

  res.status(200).json({
    success: true,
    message: 'Assessment updated successfully',
    data: { assessment },
  });
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  const candidate = await Candidate.findById(assessment.candidate);
  if (candidate) {
    candidate.assessments = candidate.assessments.filter(
      (item) => item.toString() !== assessment._id.toString()
    );
    await candidate.save();
  }

  await assessment.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Assessment deleted successfully',
  });
});
