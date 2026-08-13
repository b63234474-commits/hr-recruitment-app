import mongoose from 'mongoose';

export const ONBOARDING_STATUSES = ['Pending', 'Documents Pending', 'In Progress', 'Completed'];
export const TASK_STATUSES = ['Pending', 'Completed'];

const defaultOnboardingTasks = [
  { name: 'Personal Details', status: 'Pending' },
  { name: 'Identity Documents', status: 'Pending' },
  { name: 'Education Documents', status: 'Pending' },
  { name: 'Previous Employment Documents', status: 'Pending' },
  { name: 'Offer Letter', status: 'Pending' },
  { name: 'Joining Documents', status: 'Pending' },
  { name: 'HR Verification', status: 'Pending' },
];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    firstName: { type: String, required: true, trim: true, maxlength: 100 },
    lastName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: { type: String, trim: true, maxlength: 30 },
    department: { type: String, trim: true, maxlength: 100 },
    designation: { type: String, trim: true, maxlength: 100 },
    joiningDate: { type: Date },
    manager: { type: String, trim: true, maxlength: 100 },
    employmentType: { type: String, trim: true, maxlength: 100 },
    location: { type: String, trim: true, maxlength: 150 },
    source: { type: String, trim: true, maxlength: 100 },
    hiredJob: { type: String, trim: true, maxlength: 150 },
    onboardingStatus: {
      type: String,
      enum: ONBOARDING_STATUSES,
      default: 'Pending',
    },
    onboardingTasks: [
      {
        name: { type: String, trim: true },
        status: { type: String, enum: TASK_STATUSES, default: 'Pending' },
      },
    ],
  },
  { timestamps: true }
);

employeeSchema.pre('validate', function (next) {
  if (!this.employeeId) {
    this.employeeId = `EMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.onboardingTasks || this.onboardingTasks.length === 0) {
    this.onboardingTasks = defaultOnboardingTasks;
  }
  next();
});

employeeSchema.methods.toJSON = function () {
  const employee = this.toObject();
  delete employee.__v;
  return employee;
};

export default mongoose.model('Employee', employeeSchema);
