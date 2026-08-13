import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    technicalSkills: {
      type: Number,
      min: 0,
      max: 10,
    },
    communication: {
      type: Number,
      min: 0,
      max: 10,
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 10,
    },
    experience: {
      type: Number,
      min: 0,
      max: 10,
    },
    teamFit: {
      type: Number,
      min: 0,
      max: 10,
    },
    overallRating: {
      type: Number,
      min: 0,
      max: 10,
    },
    strengths: {
      type: String,
      trim: true,
      maxlength: [1000, 'Strengths cannot exceed 1000 characters'],
    },
    weaknesses: {
      type: String,
      trim: true,
      maxlength: [1000, 'Weaknesses cannot exceed 1000 characters'],
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comments cannot exceed 2000 characters'],
    },
    recommendation: {
      type: String,
      enum: ['Strong Hire', 'Hire', 'Hold', 'Reject'],
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate reference is required'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
    },
    interviewType: {
      type: String,
      enum: ['HR Interview', 'Technical Interview', 'Manager Interview', 'Final Interview'],
      default: 'HR Interview',
    },
    interviewer: {
      type: String,
      trim: true,
      maxlength: [150, 'Interviewer cannot exceed 150 characters'],
    },
    interviewDate: {
      type: Date,
    },
    startTime: {
      type: String,
      trim: true,
      maxlength: [20, 'Start time cannot exceed 20 characters'],
    },
    endTime: {
      type: String,
      trim: true,
      maxlength: [20, 'End time cannot exceed 20 characters'],
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [250, 'Location cannot exceed 250 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'],
      default: 'Scheduled',
    },
    feedback: feedbackSchema,
  },
  {
    timestamps: true,
  }
);

interviewSchema.pre('validate', function (next) {
  if (!this.interviewId) {
    this.interviewId = `INT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
