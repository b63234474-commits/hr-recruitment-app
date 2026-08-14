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
    // Overall match information
    overallMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    result: {
      type: String,
      enum: ['Suitable', 'Review Required', 'Not Suitable', 'Highly Suitable'],
      required: true,
    },
    suitability: {
      type: String,
      enum: ['Highly Suitable', 'Suitable', 'Review Required', 'Not Suitable'],
      default: 'Review Required',
    },

    // Detailed scoring breakdown
    skillMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    experienceMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    educationMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    designationMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Skill matching details
    matchingSkills: [String],
    missingSkills: [String],
    preferredSkillsMatched: [String],
    
    // Experience matching
    candidateExperience: String,
    requiredExperience: String,
    experienceMatch: String,
    experienceMatchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Education matching
    educationMatch: String,
    candidateEducation: String,
    requiredEducation: String,

    // Other matching details
    locationMatch: String,
    titleMatch: String,
    designationRelevance: String,

    // Explanation and reasoning
    explanation: String,
    matchingReasons: [String],
    missingReasons: [String],

    // Additional context
    candidateSkillsExtracted: [String],
    jobRequiredSkills: [String],
    jobPreferredSkills: [String],

    // Scoring weights used
    scoringWeights: {
      requiredSkills: { type: Number, default: 50 },
      experience: { type: Number, default: 25 },
      designation: { type: Number, default: 10 },
      education: { type: Number, default: 5 },
      preferredSkills: { type: Number, default: 10 },
    },
  },
  {
    timestamps: true,
  }
);

matchResultSchema.index({ candidateId: 1, jobId: 1, resumeFilename: 1 }, { unique: true });

const MatchResult = mongoose.model('MatchResult', matchResultSchema);

export default MatchResult;
