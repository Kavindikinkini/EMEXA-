import mongoose from 'mongoose';

const parentLinkSchema = new mongoose.Schema({
  parentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  studentName:   { type: String },
  studentEmail:  { type: String },
  consentLevel:  { type: String, enum: ['full', 'summary-only', 'none'], default: 'full' },
  notifyBurnout: { type: Boolean, default: true },
  notifyWeekly:  { type: Boolean, default: true },
  linkedAt:      { type: Date, default: Date.now }
}, { timestamps: true });

const ParentLink = mongoose.model('ParentLink', parentLinkSchema);
export default ParentLink;