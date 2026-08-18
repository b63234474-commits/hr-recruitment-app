import mongoose from 'mongoose';

const emailHistorySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate is required'],
    },
    candidateName: {
      type: String,
      trim: true,
      default: '',
    },
    candidateEmail: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      required: [true, 'Subject is required'],
    },
    template: {
      type: String,
      trim: true,
      default: 'Custom Email',
    },
    message: {
      type: String,
      trim: true,
      required: [true, 'Message is required'],
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed'],
      default: 'Sent',
    },
    errorMessage: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

emailHistorySchema.methods.toJSON = function () {
  const emailHistory = this.toObject();
  delete emailHistory.__v;
  return emailHistory;
};

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);

export default EmailHistory;
