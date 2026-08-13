import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Partner from '../models/Partner.js';

const generatePartnerId = async () => {
  const count = await Partner.countDocuments();
  const nextNumber = count + 1;
  return `PARTNER-${String(nextNumber).padStart(3, '0')}`;
};

export const createPartner = asyncHandler(async (req, res) => {
  const {
    companyName,
    location,
    contactPersonName,
    contactEmail,
    contactPhone,
    referredEmployeeName,
    notes,
  } = req.body;

  if (!companyName || !location) {
    throw new ApiError(400, 'Partner company name and location are required');
  }

  const existingPartner = await Partner.findOne({
    companyName: { $regex: `^${companyName.trim()}$`, $options: 'i' },
  });
  if (existingPartner) {
    throw new ApiError(400, 'A partner with this company name already exists');
  }

  const partnerId = await generatePartnerId();

  const partner = await Partner.create({
    partnerId,
    companyName: companyName.trim(),
    location: location.trim(),
    contactPersonName: contactPersonName?.trim(),
    contactEmail: contactEmail?.trim(),
    contactPhone: contactPhone?.trim(),
    referredEmployeeName: referredEmployeeName?.trim(),
    notes: notes?.trim(),
  });

  res.status(201).json({
    success: true,
    message: 'Partner created successfully',
    data: { partner },
  });
});

export const getPartners = asyncHandler(async (req, res) => {
  const partners = await Partner.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: partners.length,
    data: { partners },
  });
});

export const getPartnerById = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    throw new ApiError(404, 'Partner not found');
  }

  res.status(200).json({
    success: true,
    data: { partner },
  });
});

export const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) {
    throw new ApiError(404, 'Partner not found');
  }

  const {
    companyName,
    location,
    contactPersonName,
    contactEmail,
    contactPhone,
    referredEmployeeName,
    notes,
  } = req.body;

  if (companyName) {
    const existingPartner = await Partner.findOne({
      _id: { $ne: partner._id },
      companyName: { $regex: `^${companyName.trim()}$`, $options: 'i' },
    });
    if (existingPartner) {
      throw new ApiError(400, 'A partner with this company name already exists');
    }
    partner.companyName = companyName.trim();
  }

  if (location) partner.location = location.trim();
  if (contactPersonName !== undefined) partner.contactPersonName = contactPersonName?.trim();
  if (contactEmail !== undefined) partner.contactEmail = contactEmail?.trim();
  if (contactPhone !== undefined) partner.contactPhone = contactPhone?.trim();
  if (referredEmployeeName !== undefined) partner.referredEmployeeName = referredEmployeeName?.trim();
  if (notes !== undefined) partner.notes = notes?.trim();

  await partner.save();

  res.status(200).json({
    success: true,
    message: 'Partner updated successfully',
    data: { partner },
  });
});

export const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) {
    throw new ApiError(404, 'Partner not found');
  }

  await partner.remove();

  res.status(200).json({
    success: true,
    message: 'Partner deleted successfully',
  });
});
