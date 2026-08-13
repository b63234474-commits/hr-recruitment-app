import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate reference is required'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      maxlength: [200, 'Assessment title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Assessment description cannot exceed 2000 characters'],
    },
    assessmentType: {
      type: String,
      enum: ['Technical', 'Behavioral', 'Coding', 'Case Study', 'Other'],
      default: 'Other',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned by is required'],
    },
    assignedTo: {
      type: String,
      trim: true,
      maxlength: [150, 'Assigned To cannot exceed 150 characters'],
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    result: {
      type: String,
      enum: ['Pass', 'Fail', 'Hold'],
      default: 'Hold',
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
