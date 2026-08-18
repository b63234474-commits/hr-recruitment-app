import mongoose from 'mongoose';

export const ACTIVITY_TYPES = [
  'APPLICATION',
  'RESUME_UPLOADED',
  'RESUME_PARSED',
  'SHORTLISTED',
  'STATUS_CHANGED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_RESCHEDULED',
  'INTERVIEW_COMPLETED',
  'INTERVIEW_CANCELLED',
  'FEEDBACK_SUBMITTED',
  'SELECTED',
  'REJECTED',
  'OFFER_CREATED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'ONBOARDING_STARTED',
  'ONBOARDING_COMPLETED',
  'EMAIL_SENT',
  'NOTE_ADDED',
  'TAG_ADDED',
  'TAG_REMOVED',
  'CANDIDATE_UPDATED',
  'CANDIDATE_CREATED',
];

const candidateActivitySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: [true, 'Activity type is required'],
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: [200, 'Activity title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Activity description cannot exceed 2000 characters'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
candidateActivitySchema.index({ candidateId: 1, createdAt: -1 });
candidateActivitySchema.index({ type: 1 });

const CandidateActivity = mongoose.model('CandidateActivity', candidateActivitySchema);

export default CandidateActivity;
