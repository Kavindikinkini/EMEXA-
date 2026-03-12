import mongoose from 'mongoose';

const parentLinkSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  consentLevel: {
    type: String,
    enum: ['full', 'summary-only'],
    default: 'summary-only'
  },
  notifyBurnout: { type: Boolean, default: true },
  notifyWeekly:  { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['pending', 'active'],
    default: 'pending'
  }
}, { timestamps: true });

parentLinkSchema.index({ parentId: 1 });
parentLinkSchema.index({ studentId: 1 });

const ParentLink = mongoose.models.ParentLink ||
  mongoose.model('ParentLink', parentLinkSchema);

export default ParentLink;