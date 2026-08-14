import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      trim: true,
      maxlength: [100, 'Employment type cannot exceed 100 characters'],
    },
    minimumExperience: {
      type: Number,
      required: [true, 'Minimum experience is required'],
      min: [0, 'Minimum experience cannot be negative'],
    },
    maximumExperience: {
      type: Number,
      required: [true, 'Maximum experience is required'],
      min: [0, 'Maximum experience cannot be negative'],
    },
    salaryRange: {
      type: String,
      required: [true, 'Salary range is required'],
      trim: true,
      maxlength: [100, 'Salary range cannot exceed 100 characters'],
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    preferredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    education: {
      type: String,
      trim: true,
      maxlength: [200, 'Education field cannot exceed 200 characters'],
    },
    responsibilities: {
      type: String,
      trim: true,
      maxlength: [2000, 'Responsibilities cannot exceed 2000 characters'],
    },
    qualifications: {
      type: String,
      trim: true,
      maxlength: [2000, 'Qualifications cannot exceed 2000 characters'],
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: [3000, 'Job description cannot exceed 3000 characters'],
    },
    numberOfOpenings: {
      type: Number,
      required: [true, 'Number of openings is required'],
      min: [1, 'Number of openings must be at least 1'],
    },
    recruiter: {
      type: String,
      required: [true, 'Recruiter is required'],
      trim: true,
      maxlength: [150, 'Recruiter cannot exceed 150 characters'],
    },
    hiringManager: {
      type: String,
      required: [true, 'Hiring manager is required'],
      trim: true,
      maxlength: [150, 'Hiring manager cannot exceed 150 characters'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Paused', 'Closed'],
      default: 'Draft',
    },
    closingDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const getNextJobSequence = async () => {
  const counterCollection = mongoose.connection.collection('counters');

  try {
    // Get the latest numeric ID from existing jobs
    const [latest] = await Job.aggregate([
      { $match: { jobId: { $regex: '^JOB-\\d+$' } } },
      {
        $project: {
          numeric: {
            $toInt: {
              $substr: ['$jobId', 4, { $strLenCP: '$jobId' }],
            },
          },
        },
      },
      { $sort: { numeric: -1 } },
      { $limit: 1 },
    ]);

    const currentMax = latest?.numeric || 0;
    const nextSeq = currentMax + 1;

    // Ensure counter collection has the right value
    const result = await counterCollection.findOneAndUpdate(
      { _id: 'jobId' },
      { $set: { seq: nextSeq } },
      { upsert: true, returnDocument: 'after', new: true }
    );

    const seq = result.value?.seq || nextSeq;

    if (typeof seq !== 'number') {
      throw new Error('Invalid sequence number');
    }

    return `JOB-${String(seq).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating job ID:', error);
    throw new Error(`Failed to generate job ID: ${error.message}`);
  }
};

jobSchema.pre('validate', async function (next) {
  if (!this.jobId) {
    try {
      this.jobId = await getNextJobSequence();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Job = mongoose.model('Job', jobSchema);

export default Job;
