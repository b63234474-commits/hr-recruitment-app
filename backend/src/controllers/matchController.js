import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import MatchResult from '../models/MatchResult.js';

const parseExperienceNumber = (experience = '') => {
  const match = experience.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

const buildSequentialSearchRegex = (search) => {
  const normalized = (search || '').trim().replace(/\s+/g, '');
  if (!normalized) return null;
  return new RegExp(normalized.split('').map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'), 'i');
};

const resolveJobReference = async (jobReference) => {
  if (!jobReference) return null;
  if (mongoose.Types.ObjectId.isValid(jobReference)) {
    const job = await Job.findById(jobReference);
    if (job) return job;
  }

  const jobByJobId = await Job.findOne({ jobId: jobReference });
  if (jobByJobId) return jobByJobId;

  const regex = new RegExp(`^${jobReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  return Job.findOne({ jobTitle: regex });
};

export const MATCH_THRESHOLDS = {
  suitable: 80,
  reviewRequired: 50,
};

export const buildMatchDetails = (candidate, job) => {
  const candidateSkills = (candidate.skills || []).map((skill) => skill.toLowerCase().trim());
  const requiredSkills = (job.requiredSkills || []).map((skill) => skill.toLowerCase().trim());
  const preferredSkills = (job.preferredSkills || []).map((skill) => skill.toLowerCase().trim());

  const matchingRequired = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const matchingPreferred = preferredSkills.filter((skill) => candidateSkills.includes(skill));
  const matchingSkills = Array.from(new Set([...matchingRequired, ...matchingPreferred]));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.includes(skill));

  const candidateExperience = parseExperienceNumber(candidate.experience);
  const minExp = Number(job.minimumExperience || 0);
  const maxExp = Number(job.maximumExperience || 0);
  let experienceMatch = 'Not enough data';
  let experienceScore = 0;

  if (candidateExperience !== null) {
    if (candidateExperience >= minExp && candidateExperience <= maxExp) {
      experienceMatch = 'Good';
      experienceScore = 20;
    } else if (candidateExperience >= minExp - 1) {
      experienceMatch = 'Acceptable';
      experienceScore = 10;
    } else {
      experienceMatch = 'Poor';
      experienceScore = 0;
    }
  }

  const educationMatch = job.education
    ? candidate.education && candidate.education.toLowerCase().includes(job.education.toLowerCase())
      ? 'Matched'
      : 'Mismatched'
    : 'Not specified';
  const educationScore = job.education ? (educationMatch === 'Matched' ? 10 : 0) : 10;

  const locationMatch = job.location && candidate.location
    ? candidate.location.toLowerCase().includes(job.location.toLowerCase()) ||
      job.location.toLowerCase().includes(candidate.location.toLowerCase())
      ? 'Matched'
      : 'Mismatched'
    : 'Not specified';
  const locationScore = job.location ? (locationMatch === 'Matched' ? 5 : 0) : 5;

  const titleMatch = job.jobTitle && candidate.currentDesignation
    ? candidate.currentDesignation.toLowerCase().includes(job.jobTitle.toLowerCase()) ||
      job.jobTitle.toLowerCase().includes(candidate.currentDesignation.toLowerCase())
      ? 'Matched'
      : 'Mismatched'
    : 'Not specified';
  const titleScore = job.jobTitle ? (titleMatch === 'Matched' ? 5 : 0) : 5;

  const requiredScore = requiredSkills.length > 0
    ? Math.round((matchingRequired.length / requiredSkills.length) * 40)
    : 40;
  const preferredScore = preferredSkills.length > 0
    ? Math.round((matchingPreferred.length / preferredSkills.length) * 20)
    : 20;

  const score = Math.min(
    100,
    requiredScore + preferredScore + experienceScore + educationScore + locationScore + titleScore
  );

  let result = 'Review Required';
  if (score >= MATCH_THRESHOLDS.suitable) result = 'Suitable';
  else if (score < MATCH_THRESHOLDS.reviewRequired) result = 'Not Suitable';

  return {
    score,
    result,
    details: {
      matchingSkills,
      missingSkills,
      experienceMatch,
      educationMatch,
      locationMatch,
      titleMatch,
    },
  };
};

export const getMatchingCandidates = asyncHandler(async (req, res) => {
  const job = await resolveJobReference(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const { search, experience, matchScore, result, sortBy } = req.query;

  const candidateQuery = { resumeUrl: { $exists: true, $ne: '' } };

  if (search) {
    const regex = buildSequentialSearchRegex(search) || new RegExp(search, 'i');
    candidateQuery.$or = [
      { firstName: { $regex: regex } },
      { lastName: { $regex: regex } },
      { email: { $regex: regex } },
      { currentDesignation: { $regex: regex } },
      { location: { $regex: regex } },
    ];
  }

  if (experience) {
    if (experience === '0-1') candidateQuery.experience = /^(0|0\.?\d|1)(\.|\s|$)/i;
    else if (experience === '1-2') candidateQuery.experience = /^(1|1\.?\d|2)(\.|\s|$)/i;
    else if (experience === '2-3') candidateQuery.experience = /^(2|2\.?\d|3)(\.|\s|$)/i;
    else if (experience === '3-5') candidateQuery.experience = /^(3|4|5)(\.|\s|$)/i;
    else if (experience === '5+') candidateQuery.experience = /^(5|[6-9]|[1-9]\d*)(\.|\s|$)/i;
  }

  let candidates = await Candidate.find(candidateQuery).lean();

  const matches = await Promise.all(
    candidates.map(async (candidate) => {
      const match = buildMatchDetails(candidate, job);
      return {
        ...candidate,
        matchScore: match.score,
        result: match.result,
        matchDetails: match.details,
      };
    })
  );

  let filtered = matches;

  if (matchScore) {
    if (matchScore === '80+') filtered = filtered.filter((item) => item.matchScore >= 80);
    else if (matchScore === '60+') filtered = filtered.filter((item) => item.matchScore >= 60);
    else if (matchScore === '40+') filtered = filtered.filter((item) => item.matchScore >= 40);
    else if (matchScore === 'below40') filtered = filtered.filter((item) => item.matchScore < 40);
  }

  if (result) {
    filtered = filtered.filter((item) => item.result === result);
  }

  if (sortBy) {
    if (sortBy === 'score') filtered.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'name') filtered.sort((a, b) => a.firstName.localeCompare(b.firstName));
    else if (sortBy === 'experience') filtered.sort((a, b) => {
      const aExp = parseExperienceNumber(a.experience) ?? 0;
      const bExp = parseExperienceNumber(b.experience) ?? 0;
      return bExp - aExp;
    });
  }

  res.status(200).json({ success: true, count: filtered.length, data: { job, candidates: filtered } });
});

export const getCandidateMatch = asyncHandler(async (req, res) => {
  const job = await resolveJobReference(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const candidate = await Candidate.findById(req.params.candidateId).lean();
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const match = buildMatchDetails(candidate, job);

  const existingMatch = await MatchResult.findOne({
    candidateId: candidate._id,
    jobId: job._id,
    resumeFilename: candidate.resumeFilename,
  });

  res.status(200).json({
    success: true,
    data: {
      job,
      candidate,
      match: {
        score: match.score,
        result: match.result,
        details: match.details,
      },
      existingMatch,
    },
  });
});

export const saveCandidateMatch = asyncHandler(async (req, res) => {
  const job = await resolveJobReference(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const candidate = await Candidate.findById(req.params.candidateId);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  if (!candidate.resumeUrl || !candidate.resumeFilename) {
    throw new ApiError(400, 'Candidate resume is unavailable');
  }

  const match = buildMatchDetails(candidate, job);

  const matchResult = await MatchResult.findOneAndUpdate(
    {
      candidateId: candidate._id,
      jobId: job._id,
      resumeFilename: candidate.resumeFilename,
    },
    {
      resumeUrl: candidate.resumeUrl,
      resumeFilename: candidate.resumeFilename,
      matchScore: match.score,
      result: match.result,
      matchingSkills: match.details.matchingSkills,
      missingSkills: match.details.missingSkills,
      experienceMatch: match.details.experienceMatch,
      educationMatch: match.details.educationMatch,
      locationMatch: match.details.locationMatch,
      titleMatch: match.details.titleMatch,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ success: true, data: { matchResult } });
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const { status } = req.body;
  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  candidate.status = status;
  await candidate.save();

  res.status(200).json({ success: true, message: 'Candidate status updated', data: { candidate } });
});
