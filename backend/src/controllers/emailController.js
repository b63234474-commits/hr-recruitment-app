import nodemailer from 'nodemailer';
import Candidate from '../models/Candidate.js';
import EmailHistory from '../models/EmailHistory.js';
import Job from '../models/Job.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../middleware/asyncHandler.js';
import env from '../config/env.js';
import { createActivity } from '../utils/activityService.js';

// Create Nodemailer transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const getDisplayCandidateName = (candidate) => {
  if (!candidate) return '';
  return [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim();
};

export const sendCandidateEmail = asyncHandler(async (req, res) => {
  const { candidateId, to, subject, message, template } = req.body;

  // Check if email credentials are configured
  const emailConfigured = env.emailUser && env.emailPassword;
  
  if (!emailConfigured) {
    console.warn('[email-mock-mode] Email credentials not configured. Running in mock mode.');
  }

  if (!candidateId) {
    throw new ApiError(400, 'Candidate is required');
  }

  const candidate = await Candidate.findById(candidateId).populate('appliedJob', 'jobTitle');
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  if (!candidate.email) {
    throw new ApiError(400, 'This candidate does not have an email address.');
  }

  const recipient = (to || candidate.email || '').trim();
  if (!recipient || !validateEmail(recipient)) {
    throw new ApiError(400, 'Recipient email is invalid');
  }

  if (!subject || !String(subject).trim()) {
    throw new ApiError(400, 'Email subject is required');
  }

  if (!message || !String(message).trim()) {
    throw new ApiError(400, 'Email message is required');
  }

  const safeTemplate = template || 'Custom Email';
  const job = candidate.appliedJob ? await Job.findById(candidate.appliedJob) : null;
  const recruiterName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Recruiter';
  const companyName = env.companyName || 'HR Recruitment ATS';

  const renderedSubject = String(subject)
    .replace(/{{candidateName}}/g, getDisplayCandidateName(candidate))
    .replace(/{{candidateEmail}}/g, candidate.email || '')
    .replace(/{{jobTitle}}/g, job?.jobTitle || candidate.appliedJob?.jobTitle || '')
    .replace(/{{companyName}}/g, companyName)
    .replace(/{{recruiterName}}/g, recruiterName);

  const renderedMessage = String(message)
    .replace(/{{candidateName}}/g, getDisplayCandidateName(candidate))
    .replace(/{{candidateEmail}}/g, candidate.email || '')
    .replace(/{{jobTitle}}/g, job?.jobTitle || candidate.appliedJob?.jobTitle || '')
    .replace(/{{companyName}}/g, companyName)
    .replace(/{{recruiterName}}/g, recruiterName);

  // Send email via Gmail SMTP
  try {
    let result;
    if (emailConfigured) {
      result = await transporter.sendMail({
        from: `"Kokkiligadda Jahnavi" <${env.emailUser}>`,
        to: recipient,
        subject: renderedSubject,
        html: renderedMessage,
      });
    } else {
      // Mock mode: log email instead of sending
      console.log('[email-mock-mode] Email not sent (credentials not configured):', {
        to: recipient,
        subject: renderedSubject,
        message: renderedMessage,
      });
      result = { messageId: 'mock-' + Date.now(), accepted: [recipient] };
    }

    // Save successful email to history only after successful send
    const history = await EmailHistory.create({
      candidateId: candidate._id,
      candidateName: getDisplayCandidateName(candidate),
      candidateEmail: candidate.email,
      subject: renderedSubject,
      template: safeTemplate,
      message: renderedMessage,
      sentBy: req.user?._id,
      status: 'Sent',
      errorMessage: '',
    });

    // Create activity for email sent
    await createActivity({
      candidateId: candidate._id,
      type: 'EMAIL_SENT',
      title: 'Email Sent',
      description: `Email sent to ${recipient} with subject: ${renderedSubject}`,
      performedBy: req.user?._id,
      metadata: {
        recipient,
        subject: renderedSubject,
        template: safeTemplate,
        emailHistoryId: history._id,
      },
    });

    res.status(200).json({
      success: true,
      message: emailConfigured 
        ? `Email sent successfully to ${recipient}` 
        : `Email logged in mock mode (not actually sent). Check server logs.`,
      data: { history },
    });
  } catch (error) {
    // Save failed email to history
    const history = await EmailHistory.create({
      candidateId: candidate._id,
      candidateName: getDisplayCandidateName(candidate),
      candidateEmail: candidate.email,
      subject: renderedSubject,
      template: safeTemplate,
      message: renderedMessage,
      sentBy: req.user?._id,
      status: 'Failed',
      errorMessage: error.message || 'Failed to send email',
    });

    throw new ApiError(500, error.message || 'Failed to send email. Please try again.');
  }
});

export const getCandidateEmailHistory = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(404, 'Candidate not found');
  }

  const history = await EmailHistory.find({ candidateId })
    .populate('sentBy', 'firstName lastName role')
    .sort({ sentAt: -1 });

  res.status(200).json({
    success: true,
    data: { history },
  });
});

