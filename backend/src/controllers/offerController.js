import fs from 'fs/promises';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Offer, { OFFER_STATUSES } from '../models/Offer.js';
import Candidate from '../models/Candidate.js';
import Employee from '../models/Employee.js';
import Job from '../models/Job.js';
import ActivityLog from '../models/ActivityLog.js';
import { generateOfferPdf } from '../utils/offerPdf.js';
import { sendOfferEmail } from '../utils/emailService.js';

const populateOffer = (query) => query
  .populate('candidateId', 'firstName lastName email phone status appliedJob')
  .populate('jobId', 'jobId jobTitle department employmentType location hiringManager');

const resolveId = async (Model, value, field) => {
  if (!value) return undefined;
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ [field]: value }).select('_id');
  return doc?._id;
};

const updateCandidateStatus = async (candidate, status, user, note) => {
  if (candidate.status === status) return;
  const previousStatus = candidate.status;
  candidate.status = status;
  await candidate.save();
  const activityLog = await ActivityLog.create({
    candidate: candidate._id,
    performedBy: user?._id,
    fromStatus: previousStatus,
    toStatus: status,
    note,
  });
  candidate.activityLogs.push(activityLog._id);
  await candidate.save();
};

const createEmployeeFromAcceptedOffer = async (offer, candidate) => {
  if (!offer || !candidate) return null;
  if (offer.employeeId) {
    return offer.employeeId ? await Employee.findById(offer.employeeId) : null;
  }

  const existing = await Employee.findOne({ candidateId: candidate._id, offerId: offer._id });
  if (existing) {
    offer.employeeId = existing._id;
    await offer.save();
    return existing;
  }

  const employee = await Employee.create({
    candidateId: candidate._id,
    offerId: offer._id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    department: offer.jobId?.department || '',
    designation: offer.jobId?.jobTitle || '',
    joiningDate: offer.joiningDate,
    manager: offer.reportingManager,
    employmentType: offer.employmentType,
    location: offer.location,
    source: candidate.source,
    hiredJob: offer.jobId?.jobTitle || '',
    onboardingStatus: 'Pending',
  });

  offer.employeeId = employee._id;
  await offer.save();
  return employee;
};

const buildOfferPdf = async (offerId) => {
  const populated = await populateOffer(Offer.findById(offerId));
  if (!populated) throw new ApiError(404, 'Offer not found');
  const pdf = await generateOfferPdf(populated);
  populated.offerLetterPath = pdf.publicPath;
  await populated.save();
  return populateOffer(Offer.findById(offerId));
};

export const createOffer = asyncHandler(async (req, res) => {
  const { candidateId, jobId, salary, benefits, joiningDate, employmentType, location, reportingManager, offerDate, expiryDate, status } = req.body;
  if (!candidateId || !jobId || !salary || !joiningDate || !employmentType || !location || !reportingManager || !expiryDate) {
    throw new ApiError(400, 'Candidate, job, salary, joining date, employment type, location, reporting manager, and expiry date are required');
  }

  const candidate = await Candidate.findById(await resolveId(Candidate, candidateId, 'candidateId'));
  const job = await Job.findById(await resolveId(Job, jobId, 'jobId'));
  if (!candidate) throw new ApiError(404, 'Candidate not found');
  if (!job) throw new ApiError(404, 'Job not found');

  const offer = await Offer.create({
    candidateId: candidate._id,
    jobId: job._id,
    salary,
    benefits,
    joiningDate: new Date(joiningDate),
    employmentType,
    location,
    reportingManager,
    offerDate: offerDate ? new Date(offerDate) : new Date(),
    expiryDate: new Date(expiryDate),
    status: status || 'Draft',
  });
  await buildOfferPdf(offer._id);
  const populated = await populateOffer(Offer.findById(offer._id));
  if (candidate.status === 'Selected') await updateCandidateStatus(candidate, 'Offer Draft', req.user, 'Offer draft created');

  res.status(201).json({ success: true, message: 'Offer created successfully', data: { offer: populated } });
});

export const getOffers = asyncHandler(async (req, res) => {
  const { candidate, job, status, date, search } = req.query;
  const query = {};
  const candidateId = await resolveId(Candidate, candidate, 'candidateId');
  const jobId = await resolveId(Job, job, 'jobId');
  if (candidate) query.candidateId = candidateId || null;
  if (job) query.jobId = jobId || null;
  if (status) query.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.offerDate = { $gte: start, $lte: end };
  }

  let offerQuery = populateOffer(Offer.find(query).sort({ createdAt: -1 }));
  const offers = await offerQuery;
  const filtered = search
    ? offers.filter((offer) => `${offer.offerId} ${offer.candidateId?.firstName} ${offer.candidateId?.lastName} ${offer.jobId?.jobTitle}`.toLowerCase().includes(search.toLowerCase()))
    : offers;

  res.status(200).json({ success: true, count: filtered.length, data: { offers: filtered } });
});

export const getOfferById = asyncHandler(async (req, res) => {
  const offer = await populateOffer(Offer.findById(req.params.id));
  if (!offer) throw new ApiError(404, 'Offer not found');
  res.status(200).json({ success: true, data: { offer } });
});

export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw new ApiError(404, 'Offer not found');
  const fields = ['salary', 'benefits', 'joiningDate', 'employmentType', 'location', 'reportingManager', 'offerDate', 'expiryDate', 'status'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) offer[field] = ['joiningDate', 'offerDate', 'expiryDate'].includes(field) ? new Date(req.body[field]) : req.body[field];
  });
  if (req.body.candidateId) offer.candidateId = await resolveId(Candidate, req.body.candidateId, 'candidateId') || offer.candidateId;
  if (req.body.jobId) offer.jobId = await resolveId(Job, req.body.jobId, 'jobId') || offer.jobId;
  await offer.save();
  await buildOfferPdf(offer._id);
  const populated = await populateOffer(Offer.findById(offer._id));
  res.status(200).json({ success: true, message: 'Offer updated successfully', data: { offer: populated } });
});

export const updateOfferStatus = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id).populate('jobId');
  if (!offer) throw new ApiError(404, 'Offer not found');
  const { status } = req.body;
  if (!OFFER_STATUSES.includes(status)) throw new ApiError(400, 'Invalid offer status');
  offer.status = status;
  await offer.save();
  const candidate = await Candidate.findById(offer.candidateId);
  if (candidate && status === 'Sent') {
    await updateCandidateStatus(candidate, 'Offer Sent', req.user, 'Offer sent');
  }
  if (candidate && status === 'Accepted') {
    await updateCandidateStatus(candidate, 'Offer Accepted', req.user, 'Offer accepted');
    await createEmployeeFromAcceptedOffer(offer, candidate);
    await updateCandidateStatus(candidate, 'Hired', req.user, 'Candidate hired');
  }
  if (status === 'Sent') {
    const populated = await populateOffer(Offer.findById(offer._id));
    await sendOfferEmail({ to: populated.candidateId.email, candidateName: `${populated.candidateId.firstName} ${populated.candidateId.lastName}`, offer: populated, attachmentPath: populated.offerLetterPath });
  }
  const populated = await populateOffer(Offer.findById(offer._id));
  res.status(200).json({ success: true, message: `Offer ${status.toLowerCase()} successfully`, data: { offer: populated } });
});

export const generateOfferPdfFile = asyncHandler(async (req, res) => {
  const offer = await buildOfferPdf(req.params.id);
  const filePath = offer.offerLetterPath?.replace('/uploads/', 'uploads/');
  res.download(`${process.cwd()}/${filePath}`, `${offer.offerId}.pdf`);
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) throw new ApiError(404, 'Offer not found');
  if (offer.offerLetterPath) {
    await fs.unlink(`${process.cwd()}/${offer.offerLetterPath.replace('/uploads/', 'uploads/')}`).catch(() => {});
  }
  await Offer.deleteOne({ _id: offer._id });
  res.status(200).json({ success: true, message: 'Offer deleted successfully' });
});
