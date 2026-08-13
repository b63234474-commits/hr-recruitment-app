import mongoose from 'mongoose';

export const OFFER_STATUSES = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired'];

const offerSchema = new mongoose.Schema(
  {
    offerId: { type: String, required: true, unique: true, trim: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    salary: { type: String, required: [true, 'Salary is required'], trim: true, maxlength: 150 },
    benefits: { type: String, trim: true, maxlength: 2000 },
    joiningDate: { type: Date, required: [true, 'Joining date is required'] },
    employmentType: { type: String, required: [true, 'Employment type is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    reportingManager: { type: String, required: [true, 'Reporting manager is required'], trim: true },
    offerDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: [true, 'Offer expiry date is required'] },
    offerLetterPath: { type: String, trim: true },
    status: { type: String, enum: OFFER_STATUSES, default: 'Draft' },
  },
  { timestamps: true }
);

offerSchema.pre('validate', function (next) {
  if (!this.offerId) {
    this.offerId = `OFF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export default mongoose.model('Offer', offerSchema);
