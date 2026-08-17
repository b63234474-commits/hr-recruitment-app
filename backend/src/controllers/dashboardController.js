import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import Interview from '../models/Interview.js';
import Offer from '../models/Offer.js';
import Employee from '../models/Employee.js';
import ActivityLog from '../models/ActivityLog.js';
import { PIPELINE_STATUSES } from '../config/pipelineStatuses.js';

const groupByMonth = (field) => [
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m',
          date: `$${field}`,
        },
      },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];

const buildStageMapping = (statusCounts) => {
  const stageCounts = {
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

  const statusToStage = {
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

  statusCounts.forEach((item) => {
    const stage = statusToStage[item._id] || null;
    if (stage) {
      stageCounts[stage] += item.count;
    }
  });

  return [
    { label: 'New', count: stageCounts.New },
    { label: 'Screening', count: stageCounts.Screening },
    { label: 'Shortlisted', count: stageCounts.Shortlisted },
    { label: 'Assessment', count: stageCounts.Assessment },
    { label: 'Interview', count: stageCounts.Interview },
    { label: 'Selected', count: stageCounts.Selected },
    { label: 'Offer', count: stageCounts.Offer },
    { label: 'Hired', count: stageCounts.Hired },
  ];
};

const mapStatusCounts = (statusCounts) => {
  const result = {};
  statusCounts.forEach((item) => {
    result[item._id] = item.count;
  });
  return result;
};

const resolveJobIds = async ({ job, department, recruiter }) => {
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

const normalizeMonthLabels = (rows) => rows.map((row) => ({ month: row._id, count: row.count }));

const buildSourceBreakdown = (sourceCounts) => sourceCounts.map((item) => ({ source: item._id || 'Unknown', count: item.count }));

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalJobs, activeJobs, closedJobs, totalCandidates, candidateStatusCounts, interviewCount, offersSent, offersAccepted, shortlistedCount, hiredCount, rejectedCount, candidatesByStage, candidatesByJob, applicationsByMonth, interviewsByMonth, offersByMonth, hiresByMonth, sourceReport, rejectionReasons, recentCandidates, recentJobs, upcomingInterviews, recentOffers, recentHires] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: 'Active' }),
    Job.countDocuments({ status: 'Closed' }),
    Candidate.countDocuments(),
    Candidate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Interview.countDocuments(),
    Offer.countDocuments({ status: 'Sent' }),
    Candidate.countDocuments({ status: 'Offer Accepted' }),
    Candidate.countDocuments({ status: 'Shortlisted' }),
    Candidate.countDocuments({ status: 'Hired' }),
    Candidate.countDocuments({ status: 'Rejected' }),
    Candidate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Candidate.aggregate([
      { $match: { appliedJob: { $exists: true, $ne: null } } },
      { $group: { _id: '$appliedJob', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          jobTitle: { $ifNull: ['$job.jobTitle', 'Unassigned'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Candidate.aggregate([].concat(groupByMonth('createdAt'))),
    Interview.aggregate([ { $match: { interviewDate: { $exists: true, $ne: null } } } ].concat(groupByMonth('interviewDate'))),
    Offer.aggregate([].concat(groupByMonth('offerDate'))),
    Employee.aggregate([].concat(groupByMonth('createdAt'))),
    Candidate.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
    ActivityLog.aggregate([
      { $match: { toStatus: 'Rejected' } },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$note', null] }, { $eq: ['$note', ''] }] },
              'Unspecified',
              '$note',
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Candidate.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('appliedJob', 'jobTitle')
      .select('firstName lastName currentDesignation experience status appliedJob createdAt'),
    Job.find().sort({ createdAt: -1 }).limit(5).select('jobTitle department status numberOfOpenings recruiter createdAt'),
    Interview.find({ interviewDate: { $gte: new Date() } })
      .sort({ interviewDate: 1 })
      .limit(5)
      .populate('candidate', 'firstName lastName')
      .populate('job', 'jobTitle'),
    Offer.find().sort({ offerDate: -1 }).limit(5).populate('candidateId', 'firstName lastName').populate('jobId', 'jobTitle salaryRange').select('salary offerDate status'),
    Employee.find().sort({ createdAt: -1 }).limit(5).populate('candidateId', 'firstName lastName').populate('offerId', 'offerId'),
  ]);

  const statusMap = mapStatusCounts(candidateStatusCounts);
  const pipelineStages = buildStageMapping(candidatesByStage);

  res.status(200).json({
    success: true,
    message: 'Dashboard data loaded successfully',
    data: {
      summary: {
        totalJobs,
        activeJobs,
        closedJobs,
        totalCandidates,
        newCandidates: statusMap.New || 0,
        screening: statusMap.Screening || 0,
        shortlisted: shortlistedCount,
        assessment: statusMap.Assessment || 0,
        interviews: interviewCount,
        offersSent,
        offersAccepted,
        hired: hiredCount,
        rejected: rejectedCount,
      },
      pipelineStages,
      charts: {
        candidatesByStage: candidatesByStage.map((item) => ({ stage: item._id, count: item.count })),
        candidatesByJob: candidatesByJob.map((item) => ({ jobTitle: item.jobTitle, count: item.count })),
        applicationsByMonth: normalizeMonthLabels(applicationsByMonth),
        interviewsByMonth: normalizeMonthLabels(interviewsByMonth),
        offersByMonth: normalizeMonthLabels(offersByMonth),
        hiresByMonth: normalizeMonthLabels(hiresByMonth),
        sourceBreakdown: buildSourceBreakdown(sourceReport),
        rejectionReasons: rejectionReasons.map((item) => ({ reason: item._id, count: item.count })),
      },
      recentCandidates: recentCandidates.map((candidate) => ({
        _id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        currentDesignation: candidate.currentDesignation,
        experience: candidate.experience,
        status: candidate.status,
        appliedJob: candidate.appliedJob,
        createdAt: candidate.createdAt,
      })),
      recentJobs: recentJobs.map((job) => ({
        _id: job._id,
        jobTitle: job.jobTitle,
        department: job.department,
        numberOfOpenings: job.numberOfOpenings,
        recruiter: job.recruiter,
        status: job.status,
        createdAt: job.createdAt,
      })),
      upcomingInterviews: upcomingInterviews.map((interview) => ({
        _id: interview._id,
        candidate: interview.candidate,
        job: interview.job,
        interviewer: interview.interviewer,
        interviewDate: interview.interviewDate,
        startTime: interview.startTime,
        status: interview.status,
      })),
      recentOffers: recentOffers.map((offer) => ({
        _id: offer._id,
        candidateName: `${offer.candidateId?.firstName || '-'} ${offer.candidateId?.lastName || ''}`.trim(),
        jobTitle: offer.jobId?.jobTitle || '-',
        salary: offer.salary,
        offerDate: offer.offerDate,
        status: offer.status,
      })),
      recentHires: recentHires.map((employee) => ({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        candidateName: employee.candidateId ? `${employee.candidateId.firstName} ${employee.candidateId.lastName}` : '-',
        offerId: employee.offerId?.offerId || '-',
        department: employee.department,
        designation: employee.designation,
        createdAt: employee.createdAt,
      })),
    },
  });
});
