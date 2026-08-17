import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Candidate, { CANDIDATE_SOURCES } from '../models/Candidate.js';
import Job from '../models/Job.js';
import Partner from '../models/Partner.js';
import ActivityLog from '../models/ActivityLog.js';
import { PIPELINE_STATUSES } from '../config/pipelineStatuses.js';
import { extractSkillsFromText, extractEducationFromText } from '../utils/skillExtractor.js';

const resolveJobReference = async (appliedJob) => {
  if (!appliedJob) {
    return undefined;
  }

  if (mongoose.isValidObjectId(appliedJob)) {
    const job = await Job.findById(appliedJob);
    return job ? job._id : undefined;
  }

  const jobByJobId = await Job.findOne({ jobId: appliedJob });
  if (jobByJobId) {
    return jobByJobId._id;
  }

  const jobByTitle = await Job.findOne({ jobTitle: { $regex: `^${appliedJob}$`, $options: 'i' } });
  return jobByTitle ? jobByTitle._id : undefined;
};

const resolvePartnerReference = async (partnerReference) => {
  if (!partnerReference) {
    return undefined;
  }

  if (mongoose.isValidObjectId(partnerReference)) {
    const partner = await Partner.findById(partnerReference);
    if (partner) return partner._id;
  }

  const partnerById = await Partner.findOne({ partnerId: partnerReference });
  if (partnerById) return partnerById._id;

  return undefined;
};

const parseExperienceNumber = (experience = '') => {
  const match = experience.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
};

const buildMatchDetails = (candidate, job) => {
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

  let matchCategory = 'Review Required';
  if (score >= 75) matchCategory = 'Suitable';
  else if (score < 50) matchCategory = 'Not Suitable';

  return {
    score,
    category: matchCategory,
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

const buildCandidateMatch = async (candidate) => {
  if (!candidate.appliedJob) {
    return {
      score: 0,
      category: 'Review Required',
      details: {
        matchingSkills: [],
        missingSkills: [],
        experienceMatch: 'Not available',
        educationMatch: 'Not available',
        locationMatch: 'Not available',
        titleMatch: 'Not available',
      },
    };
  }

  const job = await Job.findById(candidate.appliedJob);
  if (!job) {
    return {
      score: 0,
      category: 'Review Required',
      details: {
        matchingSkills: [],
        missingSkills: [],
        experienceMatch: 'Not available',
        educationMatch: 'Not available',
        locationMatch: 'Not available',
        titleMatch: 'Not available',
      },
    };
  }

  return buildMatchDetails(candidate, job);
};

const extractText = async (filePath, mimetype) => {
  if (mimetype === 'application/pdf') {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(fs.readFileSync(filePath));
    return data.text;
  }

  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const mammoth = await import('mammoth');
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value;
  }

  return '';
};

const parseResumeText = (text) => {
  const normalized = text.replace(/\r/g, ' ').replace(/\n+/g, '\n');
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);

  const result = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    currentCompany: '',
    currentDesignation: '',
    location: '',
  };

  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phoneRegex = /\+?[0-9][0-9 ()\-]{6,}[0-9]/;

  lines.forEach((line) => {
    if (!result.email) {
      const match = line.match(emailRegex);
      if (match) {
        result.email = match[0];
      }
    }

    if (!result.phone) {
      const match = line.match(phoneRegex);
      if (match) {
        result.phone = match[0];
      }
    }

    if (!result.location && /location[:\-]/i.test(line)) {
      result.location = line.split(/[:\-]/)[1]?.trim() || '';
    }

    if (!result.currentCompany && /current company[:\-]/i.test(line)) {
      result.currentCompany = line.split(/[:\-]/)[1]?.trim() || '';
    }

    if (!result.currentDesignation && /current designation[:\-]/i.test(line)) {
      result.currentDesignation = line.split(/[:\-]/)[1]?.trim() || '';
    }

    if (!result.education && /education[:\-]/i.test(line)) {
      result.education = line.split(/[:\-]/)[1]?.trim() || '';
    }

    if (!result.experience && /years? of experience/i.test(line)) {
      result.experience = line;
    }
  });

  const nameLine = lines[0] || '';
  const nameParts = nameLine.split(' ').filter(Boolean);
  if (nameParts.length >= 2) {
    result.firstName = nameParts[0];
    result.lastName = nameParts.slice(1).join(' ');
  }

  return result;
};

export const uploadCandidateImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Candidate image is required');
  }

  const { filename } = req.file;

  res.status(200).json({
    success: true,
    message: 'Candidate image uploaded successfully',
    data: {
      imageUrl: `/uploads/${filename}`,
      imageFilename: filename,
    },
  });
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Resume file is required');
  }

  const { mimetype, path: filePath, filename } = req.file;
  const text = await extractText(filePath, mimetype);

  console.log('Resume extracted text length:', text.length);

  if (!text || !text.trim()) {
    console.error('Resume text extraction returned empty content', {
      mimetype,
      filename,
      filePath,
    });
    throw new ApiError(400, 'Resume text extraction returned empty content');
  }

  const parsed = parseResumeText(text);

  // Extract education automatically from resume text
  const extractedEducation = extractEducationFromText(text);
  console.log('Resume extracted education:', extractedEducation);
  if (extractedEducation && !parsed.education) {
    parsed.education = extractedEducation;
  }

  res.status(200).json({
    success: true,
    message: 'Resume parsed successfully',
    data: {
      parsed,
      resumeUrl: `/uploads/${filename}`,
      resumeFilename: filename,
      extractedEducation,
    },
  });
});

export const createCandidate = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    location,
    experience,
    currentCompany,
    currentDesignation,
    referredEmployeeName,
    education,
    source,
    appliedJob,
    partner,
    resumeUrl,
    resumeFilename,
    imageUrl,
    imageFilename,
  } = req.body;

  if (!firstName || !lastName) {
    throw new ApiError(400, 'First name and last name are required');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Email is invalid');
  }

  if (phone && !/^[0-9+\-() ]{7,30}$/.test(phone)) {
    throw new ApiError(400, 'Phone number is invalid');
  }

  const candidateData = {
    firstName,
    lastName,
    email,
    phone,
    location,
    experience,
    currentCompany,
    currentDesignation,
    education,
    source: CANDIDATE_SOURCES.includes(source) ? source : 'Other',
    status: PIPELINE_STATUSES.includes(req.body.status)
      ? req.body.status
      : 'New',
    appliedJob: await resolveJobReference(appliedJob),
    partner: await resolvePartnerReference(partner),
    referredEmployeeName,
    resumeUrl,
    resumeFilename,
    imageUrl,
    imageFilename,
  };

  const match = await buildCandidateMatch(candidateData);
  const candidate = await Candidate.create({
    ...candidateData,
    matchScore: match.score,
    matchCategory: match.category,
    matchDetails: match.details,
  });

  res.status(201).json({
    success: true,
    message: 'Candidate created successfully',
    data: { candidate },
  });
});

export const getCandidates = asyncHandler(async (req, res) => {
  const { search, source, appliedJob, experience, skills, location, status, matchScoreMin, matchScoreMax, partner, limit } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { currentCompany: { $regex: search, $options: 'i' } },
      { currentDesignation: { $regex: search, $options: 'i' } },
    ];
  }

  if (source) {
    query.source = source;
  }

  if (status) {
    query.status = status;
  }

  if (appliedJob) {
    const resolvedJobId = await resolveJobReference(appliedJob);
    if (resolvedJobId) {
      query.appliedJob = resolvedJobId;
    }
  }

  if (partner) {
    const partnerIds = [];

    if (mongoose.isValidObjectId(partner)) {
      const partnerObj = await Partner.findById(partner).select('_id');
      if (partnerObj) partnerIds.push(partnerObj._id);
    }

    const partnerRegex = new RegExp(partner, 'i');
    const matchingPartners = await Partner.find({
      $or: [
        { companyName: { $regex: partnerRegex } },
        { partnerId: partner },
      ],
    }).select('_id');

    matchingPartners.forEach((p) => partnerIds.push(p._id));

    if (partnerIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { candidates: [] },
      });
    }

    query.partner = { $in: partnerIds };
  }

  if (experience) {
    query.experience = { $regex: new RegExp(experience, 'i') };
  }

  if (location) {
    query.location = { $regex: new RegExp(location, 'i') };
  }

  if (skills) {
    const skillList = skills
      .split(/,|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => new RegExp(item, 'i'));
    if (skillList.length > 0) {
      query.skills = { $in: skillList };
    }
  }

  if (matchScoreMin || matchScoreMax) {
    query.matchScore = {};
    if (matchScoreMin) query.matchScore.$gte = Number(matchScoreMin);
    if (matchScoreMax) query.matchScore.$lte = Number(matchScoreMax);
  }

  let candidateQuery = Candidate.find(query)
    .populate('appliedJob', 'jobId jobTitle status')
    .populate('partner', 'partnerId companyName')
    .sort({ createdAt: -1 });

  if (limit && !Number.isNaN(Number(limit))) {
    candidateQuery = candidateQuery.limit(Number(limit));
  }

  const candidates = await candidateQuery;

  res.status(200).json({
    success: true,
    count: candidates.length,
    data: { candidates },
  });
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id)
    .populate('appliedJob', 'jobId jobTitle status')
    .populate('partner', 'partnerId companyName location contactPersonName contactEmail contactPhone referredEmployeeName notes')
    .populate({
      path: 'activityLogs',
      populate: {
        path: 'performedBy',
        select: 'firstName lastName role',
      },
    })
    .populate({
      path: 'assessments',
      populate: [
        { path: 'job', select: 'jobId jobTitle status' },
        { path: 'assignedBy', select: 'firstName lastName role' },
      ],
    });

  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  res.status(200).json({
    success: true,
    data: { candidate },
  });
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    location,
    experience,
    currentCompany,
    currentDesignation,
    referredEmployeeName,
    education,
    source,
    appliedJob,
    partner,
    resumeUrl,
    resumeFilename,
    imageUrl,
    imageFilename,
  } = req.body;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Email is invalid');
  }

  if (phone && !/^[0-9+\-() ]{7,30}$/.test(phone)) {
    throw new ApiError(400, 'Phone number is invalid');
  }

  candidate.firstName = firstName ?? candidate.firstName;
  candidate.lastName = lastName ?? candidate.lastName;
  candidate.email = email ?? candidate.email;
  candidate.phone = phone ?? candidate.phone;
  candidate.location = location ?? candidate.location;
  candidate.experience = experience ?? candidate.experience;
  candidate.currentCompany = currentCompany ?? candidate.currentCompany;
  candidate.currentDesignation = currentDesignation ?? candidate.currentDesignation;
  candidate.referredEmployeeName = referredEmployeeName ?? candidate.referredEmployeeName;
  candidate.education = education ?? candidate.education;
  candidate.source = CANDIDATE_SOURCES.includes(source)
    ? source
    : candidate.source;
  candidate.status = PIPELINE_STATUSES.includes(req.body.status)
    ? req.body.status
    : candidate.status;
  candidate.appliedJob = await resolveJobReference(appliedJob) || candidate.appliedJob;
  candidate.resumeUrl = resumeUrl ?? candidate.resumeUrl;
  candidate.resumeFilename = resumeFilename ?? candidate.resumeFilename;
  candidate.imageUrl = imageUrl ?? candidate.imageUrl;
  candidate.imageFilename = imageFilename ?? candidate.imageFilename;
  candidate.partner = await resolvePartnerReference(partner) || candidate.partner;

  const match = await buildCandidateMatch(candidate);
  candidate.matchScore = match.score;
  candidate.matchCategory = match.category;
  candidate.matchDetails = match.details;

  await candidate.save();

  res.status(200).json({
    success: true,
    message: 'Candidate updated successfully',
    data: { candidate },
  });
});

export const matchCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const match = await buildCandidateMatch(candidate);
  candidate.matchScore = match.score;
  candidate.matchCategory = match.category;
  candidate.matchDetails = match.details;
  await candidate.save();

  res.status(200).json({
    success: true,
    message: 'Match results updated successfully',
    data: { candidate },
  });
});

export const getPipelineStatuses = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { statuses: PIPELINE_STATUSES },
  });
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const { status, note } = req.body;
  if (!status || !PIPELINE_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid candidate pipeline status');
  }

  const previousStatus = candidate.status;
  if (previousStatus === status) {
    return res.status(200).json({
      success: true,
      message: 'Candidate already at requested status',
      data: { candidate },
    });
  }

  candidate.status = status;
  const match = await buildCandidateMatch(candidate);
  candidate.matchScore = match.score;
  candidate.matchCategory = match.category;
  candidate.matchDetails = match.details;
  await candidate.save();

  const activityLog = await ActivityLog.create({
    candidate: candidate._id,
    performedBy: req.user._id,
    fromStatus: previousStatus,
    toStatus: status,
    note: note || '',
  });

  candidate.activityLogs.push(activityLog._id);
  await candidate.save();

  res.status(200).json({
    success: true,
    message: 'Candidate pipeline status updated successfully',
    data: { candidate, activityLog },
  });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  await Candidate.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Candidate deleted successfully',
  });
});
