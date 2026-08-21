const mongoose = require('mongoose');

const skillEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    proficiency: { type: Number, required: true, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const projectEntrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    technologies: { type: [String], default: [] },
    url: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    education: { type: String, trim: true, maxlength: 300, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    currentSkills: { type: [skillEntrySchema], default: [] },
    projects: { type: [projectEntrySchema], default: [] },
    targetRole: { type: String, trim: true, maxlength: 100, default: '' },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

profileSchema.index({ user: 1 }, { unique: true });
profileSchema.index({ targetRole: 1 });
profileSchema.index({ mentor: 1 });

module.exports = mongoose.model('Profile', profileSchema);
