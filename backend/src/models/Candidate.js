import mongoose from 'mongoose';

export const CANDIDATE_SOURCES = [
  'LinkedIn',
  'Indeed',
  'Naukri',
  'Referral',
  'Company Website',
  'Email',
  'Recruiter Sourcing',
  'Walk-in',
  'Other',
];

const candidateSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [100, 'First name cannot exceed 100 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [100, 'Last name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [100, 'Experience cannot exceed 100 characters'],
    },
    currentCompany: {
      type: String,
      trim: true,
      maxlength: [150, 'Current company cannot exceed 150 characters'],
    },
    currentDesignation: {
      type: String,
      trim: true,
      maxlength: [150, 'Current designation cannot exceed 150 characters'],
    },
    referredEmployeeName: {
      type: String,
      trim: true,
      maxlength: [150, 'Referral employee name cannot exceed 150 characters'],
    },
    education: {
      type: String,
      trim: true,
      maxlength: [500, 'Education cannot exceed 500 characters'],
    },
    source: {
      type: String,
      enum: CANDIDATE_SOURCES,
      default: 'Other',
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    matchCategory: {
      type: String,
      enum: ['Suitable', 'Review Required', 'Not Suitable'],
      default: 'Review Required',
    },
    matchDetails: {
      matchingSkills: [String],
      missingSkills: [String],
      experienceMatch: String,
      educationMatch: String,
      locationMatch: String,
      titleMatch: String,
    },
    appliedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    resumeFilename: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    imageFilename: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'New',
        'Screening',
        'Shortlisted',
        'Assessment',
        'Interview Scheduled',
        'Interview Completed',
        'Selected',
        'Offer Draft',
        'Offer Sent',
        'Offer Accepted',
        'Hired',
        'Rejected',
      ],
      default: 'New',
    },
    activityLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ActivityLog',
      },
    ],
    assessments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
      },
    ],
  },
  {
    timestamps: true,
  }
);

candidateSchema.methods.toJSON = function () {
  const candidate = this.toObject();
  delete candidate.__v;
  return candidate;
};

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
