import mongoose from 'mongoose';

const emailValidator = (value) => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const phoneValidator = (value) => {
  if (!value) return true;
  return /^[0-9+\-() ]{1,30}$/.test(value);
};

const partnerSchema = new mongoose.Schema(
  {
    partnerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Partner company name is required'],
      trim: true,
      maxlength: [200, 'Partner company name cannot exceed 200 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    contactPersonName: {
      type: String,
      trim: true,
      maxlength: [150, 'Contact person name cannot exceed 150 characters'],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: emailValidator,
        message: 'Please provide a valid email address',
      },
    },
    contactPhone: {
      type: String,
      trim: true,
      validate: {
        validator: phoneValidator,
        message: 'Please provide a valid phone number',
      },
    },
    referredEmployeeName: {
      type: String,
      trim: true,
      maxlength: [150, 'Referred employee name cannot exceed 150 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

partnerSchema.methods.toJSON = function () {
  const partner = this.toObject();
  delete partner.__v;
  return partner;
};

const Partner = mongoose.model('Partner', partnerSchema);

export default Partner;
