import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Job from '../models/Job.js';

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSequentialSearchRegex = (search) => {
  const normalized = (search || '').trim().replace(/\s+/g, '');
  if (!normalized) return null;
  const pattern = normalized
    .split('')
    .map((char) => escapeRegex(char))
    .join('.*');
  return new RegExp(pattern, 'i');
};

export const createJob = asyncHandler(async (req, res) => {
  console.log('createJob payload:', req.body);

  const {
    jobTitle,
    department,
    location,
    employmentType,
    minimumExperience,
    maximumExperience,
    salaryRange,
    requiredSkills,
    preferredSkills,
    education,
    responsibilities,
    qualifications,
    jobDescription,
    numberOfOpenings,
    recruiter,
    hiringManager,
    status,
    closingDate,
  } = req.body;

  if (
    !jobTitle ||
    !department ||
    !location ||
    !employmentType ||
    minimumExperience === undefined ||
    maximumExperience === undefined ||
    !salaryRange ||
    !jobDescription ||
    numberOfOpenings === undefined ||
    !recruiter ||
    !hiringManager
  ) {
    console.error('createJob validation failed: missing required fields', req.body);
    throw new ApiError(400, 'Missing required job fields');
  }

  if (Number(minimumExperience) > Number(maximumExperience)) {
    console.error('createJob validation failed: min exp > max exp', {
      minimumExperience,
      maximumExperience,
    });
    throw new ApiError(
      400,
      'Minimum experience cannot be greater than maximum experience'
    );
  }

  const job = await Job.create({
    jobTitle,
    department,
    location,
    employmentType,
    minimumExperience: Number(minimumExperience),
    maximumExperience: Number(maximumExperience),
    salaryRange,
    requiredSkills: parseStringArray(requiredSkills),
    preferredSkills: parseStringArray(preferredSkills),
    education,
    responsibilities,
    qualifications,
    jobDescription,
    numberOfOpenings: Number(numberOfOpenings),
    recruiter,
    hiringManager,
    status: status || 'Draft',
    closingDate: closingDate ? new Date(closingDate) : undefined,
  });

  console.log('createJob result:', job._id);

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    data: { job },
  });
});

export const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    department,
    location,
    employmentType,
    recruiter,
    hiringManager,
  } = req.query;

  const query = {};

  if (search) {
    const regex = buildSequentialSearchRegex(search) || new RegExp(escapeRegex(search), 'i');
    query.$or = [
      { jobTitle: { $regex: regex } },
      { department: { $regex: regex } },
      { location: { $regex: regex } },
      { jobDescription: { $regex: regex } },
      { jobId: { $regex: regex } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (department) {
    query.department = department;
  }

  if (location) {
    query.location = location;
  }

  if (employmentType) {
    query.employmentType = employmentType;
  }

  if (recruiter) {
    query.recruiter = recruiter;
  }

  if (hiringManager) {
    query.hiringManager = hiringManager;
  }

  const jobs = await Job.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: { jobs },
  });
});

const resolveJobReference = async (jobReference) => {
  if (!jobReference) return undefined;
  if (mongoose.isValidObjectId(jobReference)) {
    const job = await Job.findById(jobReference);
    if (job) return job;
  }
  const jobByJobId = await Job.findOne({ jobId: jobReference });
  if (jobByJobId) return jobByJobId;
  const jobByTitle = await Job.findOne({ jobTitle: { $regex: `^${escapeRegex(jobReference)}$`, $options: 'i' } });
  return jobByTitle;
};

export const getJobById = asyncHandler(async (req, res) => {
  const job = await resolveJobReference(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  res.status(200).json({
    success: true,
    data: { job },
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const updates = {
    jobTitle: req.body.jobTitle,
    department: req.body.department,
    location: req.body.location,
    employmentType: req.body.employmentType,
    minimumExperience:
      req.body.minimumExperience !== undefined
        ? Number(req.body.minimumExperience)
        : job.minimumExperience,
    maximumExperience:
      req.body.maximumExperience !== undefined
        ? Number(req.body.maximumExperience)
        : job.maximumExperience,
    salaryRange: req.body.salaryRange,
    requiredSkills: parseStringArray(req.body.requiredSkills),
    preferredSkills: parseStringArray(req.body.preferredSkills),
    education: req.body.education,
    responsibilities: req.body.responsibilities,
    qualifications: req.body.qualifications,
    jobDescription: req.body.jobDescription,
    numberOfOpenings:
      req.body.numberOfOpenings !== undefined
        ? Number(req.body.numberOfOpenings)
        : job.numberOfOpenings,
    recruiter: req.body.recruiter,
    hiringManager: req.body.hiringManager,
    status: req.body.status,
    closingDate: req.body.closingDate
      ? new Date(req.body.closingDate)
      : req.body.closingDate === ''
      ? undefined
      : job.closingDate,
  };

  if (
    updates.minimumExperience !== undefined &&
    updates.maximumExperience !== undefined &&
    updates.minimumExperience > updates.maximumExperience
  ) {
    throw new ApiError(
      400,
      'Minimum experience cannot be greater than maximum experience'
    );
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined) {
      job[key] = updates[key];
    }
  });

  await job.save();

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: { job },
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  await job.remove();

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully',
  });
});
