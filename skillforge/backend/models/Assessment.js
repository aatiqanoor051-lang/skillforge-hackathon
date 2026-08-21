const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
    topic: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const topicScoreSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    correct: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const missingSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    reason: { type: String, required: true },
    currentProficiency: { type: Number, required: true },
    requiredProficiency: { type: Number, required: true },
    gap: { type: Number, required: true },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: { type: String, required: true, trim: true },
    answers: { type: [answerSchema], default: [] },
    topicScores: { type: [topicScoreSchema], default: [] },
    overallScore: { type: Number, required: true, min: 0, max: 100, default: 0 },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [missingSkillSchema], default: [] },
    analysisWarnings: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assessmentSchema.index({ user: 1, createdAt: -1 });
assessmentSchema.index({ targetRole: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
