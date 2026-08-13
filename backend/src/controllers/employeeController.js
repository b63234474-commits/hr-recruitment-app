import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Candidate from '../models/Candidate.js';
import Offer from '../models/Offer.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const resolveId = async (Model, value, field) => {
  if (!value) return undefined;
  if (mongoose.isValidObjectId(value)) return value;
  const doc = await Model.findOne({ [field]: value }).select('_id');
  return doc?._id;
};

export const createEmployee = asyncHandler(async (req, res) => {
  const {
    candidateId,
    offerId,
    firstName,
    lastName,
    email,
    phone,
    department,
    designation,
    joiningDate,
    manager,
    employmentType,
    location,
    source,
    hiredJob,
    onboardingStatus,
    onboardingTasks,
  } = req.body;

  if (!candidateId) {
    throw new ApiError(400, 'Candidate ID is required');
  }
  if (!offerId) {
    throw new ApiError(400, 'Offer ID is required');
  }
  if (!firstName || !lastName) {
    throw new ApiError(400, 'First name and last name are required');
  }

  const resolvedCandidateId = await resolveId(Candidate, candidateId, 'candidateId');
  const resolvedOfferId = await resolveId(Offer, offerId, 'offerId');
  if (!resolvedCandidateId) {
    throw new ApiError(404, 'Candidate not found');
  }
  if (!resolvedOfferId) {
    throw new ApiError(404, 'Offer not found');
  }

  const employeeData = {
    candidateId: resolvedCandidateId,
    offerId: resolvedOfferId,
    firstName,
    lastName,
    email,
    phone,
    department,
    designation,
    joiningDate: joiningDate ? new Date(joiningDate) : undefined,
    manager,
    employmentType,
    location,
    source,
    hiredJob,
    onboardingStatus,
    onboardingTasks,
  };

  const employee = await Employee.create(employeeData);

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: { employee },
  });
});

export const getEmployees = asyncHandler(async (req, res) => {
  const {
    search,
    onboardingStatus,
    department,
    designation,
    manager,
    employmentType,
    location,
    candidateId,
    offerId,
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { employeeId: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { manager: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { hiredJob: { $regex: search, $options: 'i' } },
    ];
  }

  if (onboardingStatus) query.onboardingStatus = onboardingStatus;
  if (department) query.department = department;
  if (designation) query.designation = designation;
  if (manager) query.manager = manager;
  if (employmentType) query.employmentType = employmentType;
  if (location) query.location = location;
  if (candidateId) query.candidateId = await resolveId(Candidate, candidateId, 'candidateId');
  if (offerId) query.offerId = await resolveId(Offer, offerId, 'offerId');

  const employees = await Employee.find(query)
    .populate('candidateId', 'firstName lastName email status')
    .populate('offerId', 'offerId status')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: employees.length, data: { employees } });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('candidateId', 'firstName lastName email phone status')
    .populate('offerId', 'offerId status');

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  res.status(200).json({ success: true, data: { employee } });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const {
    candidateId,
    offerId,
    firstName,
    lastName,
    email,
    phone,
    department,
    designation,
    joiningDate,
    manager,
    employmentType,
    location,
    source,
    hiredJob,
    onboardingStatus,
    onboardingTasks,
  } = req.body;

  employee.candidateId = await resolveId(Candidate, candidateId, 'candidateId') || employee.candidateId;
  employee.offerId = await resolveId(Offer, offerId, 'offerId') || employee.offerId;
  employee.firstName = firstName ?? employee.firstName;
  employee.lastName = lastName ?? employee.lastName;
  employee.email = email ?? employee.email;
  employee.phone = phone ?? employee.phone;
  employee.department = department ?? employee.department;
  employee.designation = designation ?? employee.designation;
  employee.joiningDate = joiningDate ? new Date(joiningDate) : employee.joiningDate;
  employee.manager = manager ?? employee.manager;
  employee.employmentType = employmentType ?? employee.employmentType;
  employee.location = location ?? employee.location;
  employee.source = source ?? employee.source;
  employee.hiredJob = hiredJob ?? employee.hiredJob;
  employee.onboardingStatus = onboardingStatus || employee.onboardingStatus;
  employee.onboardingTasks = Array.isArray(onboardingTasks) ? onboardingTasks : employee.onboardingTasks;

  await employee.save();

  res.status(200).json({ success: true, message: 'Employee updated successfully', data: { employee } });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  await employee.deleteOne();

  res.status(200).json({ success: true, message: 'Employee deleted successfully' });
});
