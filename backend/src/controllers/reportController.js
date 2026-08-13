import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Candidate from '../models/Candidate.js';
import Interview from '../models/Interview.js';
import Job from '../models/Job.js';
import Offer from '../models/Offer.js';
import Employee from '../models/Employee.js';
import ActivityLog from '../models/ActivityLog.js';

const parseDate = (value, endOfDay = false) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const buildJobQuery = async ({ job, department, recruiter }) => {
  const query = {};

  if (job) {
    if (mongoose.isValidObjectId(job)) {
      query._id = job;
    } else {
      query.$or = [
        { jobId: job },
        { jobTitle: { $regex: new RegExp(`^${job}$`, 'i') } },
      ];
    }
  }

  if (department) query.department = department;
  if (recruiter) query.recruiter = recruiter;

  if (!Object.keys(query).length) return undefined;

  const jobs = await Job.find(query).select('_id');
  return jobs.map((item) => item._id);
};

const buildStageCounts = (statusCounts) => {
  const stageMap = {
    New: 'New',
    Screening: 'Screening',
    Shortlisted: 'Shortlisted',
    Assessment: 'Assessment',
    'Interview Scheduled': 'Interview',
    'Interview Completed': 'Interview',
    Selected: 'Selected',
    'Offer Draft': 'Offer',
    'Offer Sent': 'Offer',
    'Offer Accepted': 'Offer',
    Hired: 'Hired',
    Rejected: 'Rejected',
  };

  const result = {
    New: 0,
    Screening: 0,
    Shortlisted: 0,
    Assessment: 0,
    Interview: 0,
    Selected: 0,
    Offer: 0,
    Hired: 0,
    Rejected: 0,
  };

  statusCounts.forEach((item) => {
    const stage = stageMap[item._id] || null;
    if (stage) {
      result[stage] += item.count;
    }
  });

  return Object.entries(result).map(([label, count]) => ({ label, count }));
};

const groupByMonth = (field) => [
  {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m', date: `$${field}` },
      },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];

const normalizeMonthData = (rows) => rows.map((row) => ({ month: row._id, count: row.count }));

const buildStatusCounts = (rows) => rows.map((row) => ({ status: row._id, count: row.count }));

export const getReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, job, department, recruiter, source, status } = req.query;

  const start = parseDate(startDate);
  const end = parseDate(endDate, true);
  const jobIds = await buildJobQuery({ job, department, recruiter });

  const candidateMatch = {};
  if (start) candidateMatch.createdAt = { ...candidateMatch.createdAt, $gte: start };
  if (end) candidateMatch.createdAt = { ...candidateMatch.createdAt, $lte: end };
  if (jobIds) candidateMatch.appliedJob = { $in: jobIds };
  if (source) candidateMatch.source = source;
  if (status) candidateMatch.status = status;

  const interviewMatch = {};
  if (start) interviewMatch.createdAt = { ...interviewMatch.createdAt, $gte: start };
  if (end) interviewMatch.createdAt = { ...interviewMatch.createdAt, $lte: end };
  if (jobIds) interviewMatch.job = { $in: jobIds };

  const offerMatch = {};
  if (start) offerMatch.createdAt = { ...offerMatch.createdAt, $gte: start };
  if (end) offerMatch.createdAt = { ...offerMatch.createdAt, $lte: end };
  if (jobIds) offerMatch.jobId = { $in: jobIds };

  const hireMatch = {};
  if (start) hireMatch.createdAt = { ...hireMatch.createdAt, $gte: start };
  if (end) hireMatch.createdAt = { ...hireMatch.createdAt, $lte: end };

  const [candidateStatusCounts, sourceCounts, pipelineCounts, candidateCount, candidateList, interviewStatusCounts, interviewerCounts, interviewCount, offerStatusCounts, offerCount, applicationsByMonth, interviewsByMonth, offersByMonth, hiresByMonth, hiresByJobCounts, jobsReport, recentCandidates] = await Promise.all([
    Candidate.aggregate([{ $match: candidateMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Candidate.aggregate([{ $match: candidateMatch }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
    Candidate.aggregate([{ $match: candidateMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Candidate.countDocuments(candidateMatch),
    Candidate.find(candidateMatch).sort({ createdAt: -1 }).limit(10).populate('appliedJob', 'jobTitle').select('firstName lastName email status source appliedJob createdAt'),
    Interview.aggregate([{ $match: interviewMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Interview.aggregate([{ $match: interviewMatch }, { $group: { _id: '$interviewer', count: { $sum: 1 } } }]),
    Interview.countDocuments(interviewMatch),
    Offer.aggregate([{ $match: offerMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Offer.countDocuments(offerMatch),
    Candidate.aggregate([{ $match: candidateMatch }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Interview.aggregate([{ $match: { ...interviewMatch, interviewDate: { $exists: true, $ne: null } } }, ...groupByMonth('interviewDate')]),
    Offer.aggregate([{ $match: offerMatch }, ...groupByMonth('offerDate')]),
    Employee.aggregate([{ $match: hireMatch }, ...groupByMonth('createdAt')]),
    Candidate.aggregate([{ $match: candidateMatch }, { $group: { _id: '$appliedJob', count: { $sum: 1 } } }, { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } }, { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } }, { $project: { jobTitle: { $ifNull: ['$job.jobTitle', 'Unassigned'] }, count: 1 } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Job.find(jobIds ? { _id: { $in: jobIds } } : {}).sort({ createdAt: -1 }).limit(10).select('jobTitle department recruiter status numberOfOpenings'),
    Candidate.find(candidateMatch).sort({ createdAt: -1 }).limit(10).populate('appliedJob', 'jobTitle').select('firstName lastName status source appliedJob createdAt'),
  ]);

  const funnel = buildStageCounts(pipelineCounts);

  res.status(200).json({
    success: true,
    data: {
      filters: { startDate, endDate, job, department, recruiter, source, status },
      summary: {
        totalCandidates: candidateCount,
        totalInterviews: interviewCount,
        totalOffers: offerCount,
        totalHires: hiresByMonth.reduce((sum, row) => sum + row.count, 0),
      },
      candidateReport: {
        statusCounts: buildStatusCounts(candidateStatusCounts),
        sourceCounts: sourceCounts.map((item) => ({ source: item._id || 'Unknown', count: item.count })),
        topJobs: hiresByJobCounts,
        recentCandidates,
      },
      interviewReport: {
        statusCounts: buildStatusCounts(interviewStatusCounts),
        interviewerCounts: interviewerCounts.map((item) => ({ interviewer: item._id || 'Unassigned', count: item.count })),
      },
      offerReport: {
        statusCounts: buildStatusCounts(offerStatusCounts),
      },
      sourceReport: sourceCounts.map((item) => ({ source: item._id || 'Unknown', count: item.count })),
      funnel: funnel,
      charts: {
        applicationsByMonth: normalizeMonthData(applicationsByMonth),
        interviewsByMonth: normalizeMonthData(interviewsByMonth),
        offersByMonth: normalizeMonthData(offersByMonth),
        hiresByMonth: normalizeMonthData(hiresByMonth),
        hiresByJob: hiresByJobCounts,
      },
      jobs: jobsReport,
    },
  });
});
