const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    url: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Resource URL must be a valid http(s) URL'],
    },
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'documentation', 'book', 'tool', 'other'],
      default: 'article',
    },
    topics: { type: [String], default: [] },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    source: { type: String, trim: true, maxlength: 200, default: '' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

resourceSchema.index({ topics: 1 });
resourceSchema.index({ verificationStatus: 1 });
resourceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
