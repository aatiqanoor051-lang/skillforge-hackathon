const mongoose = require('mongoose');

const weekStepSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true, min: 1, max: 4 },
    title: { type: String, required: true, trim: true },
    objectives: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    estimatedHours: { type: Number, required: true, min: 0 },
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, default: '' },
        type: { type: String, default: 'article' },
      },
    ],
    project: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    deliverables: { type: [String], default: [] },
    completionCriteria: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceAssessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', default: null },
    targetRole: { type: String, required: true, trim: true },
    generationMethod: {
      type: String,
      enum: ['ai', 'ai_retry', 'deterministic_fallback'],
      required: true,
    },
    generationMeta: {
      model: { type: String, default: '' },
      generatedAt: { type: Date, default: Date.now },
      basedOnMissingSkills: { type: [String], default: [] },
    },
    weeks: {
      type: [weekStepSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4,
        message: 'A roadmap must contain exactly 4 weekly steps.',
      },
    },
    overallStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    isLatest: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roadmapSchema.index({ user: 1, createdAt: -1 });
roadmapSchema.index({ user: 1, isLatest: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
