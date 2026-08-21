const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true, maxlength: 100 },
    minProficiency: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const roleRequirementSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    requiredSkills: {
      type: [requiredSkillSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A role must define at least one required skill.',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleRequirementSchema.index({ role: 1 }, { unique: true });
roleRequirementSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('RoleRequirement', roleRequirementSchema);
