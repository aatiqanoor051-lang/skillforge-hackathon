import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('setup'); // setup | quiz | result
  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadRoles() {
      try {
        const [rolesRes, profileRes] = await Promise.all([api.get('/roles'), api.get('/profile')]);
        setRoles(rolesRes.data.data.roles);
        const savedRole = profileRes.data.data.profile.targetRole;
        if (savedRole) setTargetRole(savedRole);
      } catch (err) {
        setError(unwrapError(err));
      }
    }
    loadRoles();
  }, []);

  async function startAssessment() {
    if (!targetRole) {
      setError('Please select a target role first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/assessment/questions', { params: { role: targetRole } });
      setQuestions(res.data.data.questions);
      setAnswers({});
      setCurrentIdx(0);
      setStage('quiz');
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function submitAssessment() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        targetRole,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
      };
      const res = await api.post('/assessment/submit', payload);
      setResult(res.data.data);
      setStage('result');
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  async function generateRoadmap() {
    setLoading(true);
    setError(null);
    try {
      await api.post('/roadmap/generate', { assessmentId: result.assessment._id });
      navigate('/roadmap');
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-light">Skill assessment</h1>
      <p className="mt-1 text-sm text-brand-steel">
        A short quiz tailored to your target role, used to measure your current readiness.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {stage === 'setup' && (
        <Card className="mt-6">
          <label className="mb-1 block text-sm font-medium text-brand-light">Target role</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light focus:border-brand-orchid focus:outline-none"
          >
            <option value="">Select a role…</option>
            {roles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.role}
              </option>
            ))}
          </select>
          <Button className="mt-4" onClick={startAssessment} disabled={loading}>
            {loading ? 'Loading…' : 'Start assessment'}
          </Button>
        </Card>
      )}

      {stage === 'quiz' && currentQuestion && (
        <Card className="mt-6">
          <div className="mb-4">
            <ProgressBar
              value={((currentIdx + 1) / questions.length) * 100}
              label={`Question ${currentIdx + 1} of ${questions.length} · ${currentQuestion.topic}`}
            />
          </div>

          <p className="text-lg font-medium text-brand-light">{currentQuestion.question}</p>

          <div className="mt-4 space-y-2">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orchid ${
                    isSelected
                      ? 'border-brand-orchid bg-brand-orchid/15 text-brand-orchid'
                      : 'border-brand-steel/30 text-brand-light hover:border-brand-steel/60'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              Previous
            </Button>
            <span className="text-xs text-brand-steel">{answeredCount} of {questions.length} answered</span>
            {currentIdx < questions.length - 1 ? (
              <Button onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
                Next
              </Button>
            ) : (
              <Button onClick={submitAssessment} disabled={loading || answeredCount === 0}>
                {loading ? 'Submitting…' : 'Submit assessment'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {stage === 'result' && result && (
        <div className="mt-6 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-brand-light">Overall readiness</h2>
            <div className="mt-3">
              <ProgressBar value={result.analysis.overallReadiness} label={targetRole} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-brand-light">Topic breakdown</h2>
            <div className="space-y-3">
              {result.analysis.topicScores.map((t) => (
                <ProgressBar key={t.topic} value={t.percentage} label={`${t.topic} (${t.correct}/${t.total})`} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-brand-light">
              Skill gaps <span className="text-brand-steel">({result.analysis.missingSkills.length})</span>
            </h2>
            {result.analysis.missingSkills.length === 0 ? (
              <p className="text-sm text-brand-steel">No gaps detected — great work!</p>
            ) : (
              <ul className="space-y-2">
                {result.analysis.missingSkills.map((m) => (
                  <li
                    key={m.skill}
                    className="rounded-lg border border-brand-orchid/30 bg-brand-orchid/5 px-3 py-2 text-sm text-brand-light shadow-[0_0_0_1px_rgba(221,174,211,0.15)]"
                  >
                    <span className="font-semibold text-brand-orchid">{m.skill}</span> — currently{' '}
                    {m.currentProficiency}/100, target {m.requiredProficiency}/100
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button onClick={generateRoadmap} disabled={loading}>
            {loading ? 'Generating…' : 'Generate my learning roadmap →'}
          </Button>
        </div>
      )}
    </div>
  );
}
