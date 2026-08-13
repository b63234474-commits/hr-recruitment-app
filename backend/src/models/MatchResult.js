import mongoose from 'mongoose';

const matchResultSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    resumeFilename: {
      type: String,
      trim: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    result: {
      type: String,
      enum: ['Suitable', 'Review Required', 'Not Suitable'],
      required: true,
    },
    matchingSkills: [String],
    missingSkills: [String],
    experienceMatch: String,
    educationMatch: String,
    locationMatch: String,
    titleMatch: String,
  },
  {
    timestamps: true,
  }
);

matchResultSchema.index({ candidateId: 1, jobId: 1, resumeFilename: 1 }, { unique: true });

const MatchResult = mongoose.model('MatchResult', matchResultSchema);

export default MatchResult;
