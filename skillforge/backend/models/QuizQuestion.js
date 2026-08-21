const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true, maxlength: 100 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message: 'A question must have between 2 and 6 options.',
      },
    },
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true, maxlength: 1000 },
    applicableRoles: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A question must apply to at least one role.',
      },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

quizQuestionSchema.index({ topic: 1, difficulty: 1 });
quizQuestionSchema.index({ applicableRoles: 1 });

quizQuestionSchema.pre('validate', function guardCorrectAnswer(next) {
  if (this.options && this.correctAnswer && !this.options.includes(this.correctAnswer)) {
    return next(new Error('correctAnswer must be one of the provided options.'));
  }
  next();
});

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
