import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import MatchResult from '../models/MatchResult.js';
import { calculateMatchScore } from '../utils/matchingAlgorithm.js';
import { extractSkillsFromJD } from '../utils/skillExtractor.js';

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

  // Use enhanced matching algorithm
  const matches = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const matchResult = calculateMatchScore(candidate, job);
        return {
          ...candidate,
          matchScore: matchResult.overallMatchScore,
          result: matchResult.suitability,
          matchDetails: matchResult,
        };
      } catch (err) {
        // Fallback to old matching if new algorithm fails
        const match = buildMatchDetails(candidate, job);
        return {
          ...candidate,
          matchScore: match.score,
          result: match.result,
          matchDetails: { details: match.details },
        };
      }
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

  // Use enhanced matching algorithm
  let match;
  try {
    match = calculateMatchScore(candidate, job);
  } catch (err) {
    // Fallback to old algorithm
    const oldMatch = buildMatchDetails(candidate, job);
    match = { 
      overallMatchScore: oldMatch.score,
      suitability: oldMatch.result,
      ...oldMatch
    };
  }

  const existingMatch = await MatchResult.findOne({
    candidateId: candidate._id,
    jobId: job._id,
    resumeFilename: candidate.resumeFilename,
  });

  // Auto-extract skills from job description if not already extracted
  let jobSkills = job.requiredSkills || [];
  if (jobSkills.length === 0 && job.jobDescription) {
    console.log('Auto-extracting skills from job description for job:', job._id);
    const extracted = extractSkillsFromJD(job.jobDescription);
    jobSkills = extracted.requiredSkills || [];
    // Also update the job in database for future use
    await Job.findByIdAndUpdate(job._id, { requiredSkills: jobSkills });
  }

  // Enhance response with detailed skill information
  const enhancedMatch = {
    ...match,
    jobSkills,
    resumeSkills: candidate.extractedSkills || candidate.skills || [],
  };

  res.status(200).json({
    success: true,
    data: {
      job,
      candidate,
      match: enhancedMatch,
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

  // Use enhanced matching algorithm
  let match;
  try {
    match = calculateMatchScore(candidate, job);
  } catch (err) {
    // Fallback to old algorithm
    const oldMatch = buildMatchDetails(candidate, job);
    match = { 
      overallMatchScore: oldMatch.score,
      suitability: oldMatch.result,
      matchedSkills: oldMatch.details.matchingSkills,
      missingSkills: oldMatch.details.missingSkills,
    };
  }

  const matchResult = await MatchResult.findOneAndUpdate(
    {
      candidateId: candidate._id,
      jobId: job._id,
      resumeFilename: candidate.resumeFilename,
    },
    {
      resumeUrl: candidate.resumeUrl,
      resumeFilename: candidate.resumeFilename,
      overallMatchScore: match.overallMatchScore,
      matchScore: match.overallMatchScore,
      skillMatchScore: match.skillMatchScore || match.overallMatchScore,
      experienceMatchScore: match.experienceMatchScore || 0,
      educationMatchScore: match.educationMatchScore || 0,
      designationMatchScore: match.designationMatchScore || 0,
      result: match.suitability || 'Review Required',
      suitability: match.suitability || 'Review Required',
      matchingSkills: match.matchedSkills || [],
      missingSkills: match.missingSkills || [],
      preferredSkillsMatched: match.preferredSkillsMatched || [],
      candidateExperience: match.candidateExperience,
      requiredExperience: match.requiredExperience,
      experienceMatch: match.experienceMatch?.toString(),
      experienceMatchPercentage: match.experienceMatchPercentage || 0,
      educationMatch: match.educationMatch,
      candidateEducation: match.candidateEducation,
      requiredEducation: match.requiredEducation,
      locationMatch: match.locationMatch,
      titleMatch: match.titleMatch,
      designationRelevance: match.designationRelevance,
      explanation: match.explanation,
      matchingReasons: match.matchingReasons || [],
      missingReasons: match.missingReasons || [],
      candidateSkillsExtracted: match.candidateSkillsExtracted || candidate.extractedSkills || candidate.skills || [],
      jobRequiredSkills: match.jobRequiredSkills || job.requiredSkills || [],
      jobPreferredSkills: match.jobPreferredSkills || job.preferredSkills || [],
      scoringWeights: match.scoringWeights || {},
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
