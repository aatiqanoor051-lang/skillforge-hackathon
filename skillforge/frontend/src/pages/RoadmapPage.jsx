import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

const STATUS_STYLES = {
  not_started: 'border-brand-steel/30 text-brand-steel',
  in_progress: 'border-brand-orchid/50 text-brand-orchid bg-brand-orchid/10',
  completed: 'border-green-400/50 text-green-300 bg-green-400/10',
};

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function loadRoadmap() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/roadmap/latest');
      setRoadmap(res.data.data.roadmap);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoadmap();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('/roadmap/generate', {});
      setRoadmap(res.data.data.roadmap);
      setActiveWeek(1);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setGenerating(false);
    }
  }

  async function updateWeekStatus(weekNumber, status) {
    if (!roadmap) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/roadmap/${roadmap._id}/progress`, { weekNumber, status });
      setRoadmap(res.data.data.roadmap);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-brand-steel">Loading roadmap…</div>;
  }

  if (!roadmap) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold text-brand-light">No roadmap yet</h1>
        <p className="mt-2 text-sm text-brand-steel">
          Complete an assessment first, then generate your personalized 4-week roadmap.
        </p>
        {error && (
          <div role="alert" className="mx-auto mt-4 max-w-md rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/assessment">
            <Button>Take assessment</Button>
          </Link>
          <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Try generate anyway'}
          </Button>
        </div>
      </div>
    );
  }

  const week = roadmap.weeks.find((w) => w.weekNumber === activeWeek);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-light">Your roadmap: {roadmap.targetRole}</h1>
          <p className="mt-1 text-sm text-brand-steel">
            Generated via {roadmap.generationMethod === 'deterministic_fallback' ? 'rule-based fallback' : 'AI'}
            {roadmap.generationMeta?.generatedAt &&
              ` on ${new Date(roadmap.generationMeta.generatedAt).toLocaleDateString()}`}
            .
          </p>
        </div>
        <Button variant="secondary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Regenerating…' : 'Regenerate roadmap'}
        </Button>
      </div>

      <div className="mt-4">
        <ProgressBar value={roadmap.completionPercentage} label="Overall completion" />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {roadmap.weeks.map((w) => (
          <button
            key={w.weekNumber}
            onClick={() => setActiveWeek(w.weekNumber)}
            className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orchid ${
              activeWeek === w.weekNumber
                ? 'border-brand-orchid bg-brand-orchid/15 text-brand-orchid'
                : 'border-brand-steel/30 text-brand-light hover:border-brand-steel/60'
            }`}
          >
            Week {w.weekNumber}
          </button>
        ))}
      </div>

      {week && (
        <Card className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-brand-light">{week.title}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[week.status]}`}>
              {STATUS_LABELS[week.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-steel">Estimated: {week.estimatedHours} hours</p>

          <section className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">Objectives</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-light">
              {week.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">Topics</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {week.topics.map((t, i) => (
                <span key={i} className="rounded-full bg-brand-steel/15 px-3 py-1 text-xs text-brand-light">
                  {t}
                </span>
              ))}
            </div>
          </section>

          {week.resources && week.resources.length > 0 && (
            <section className="mt-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">Resources</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {week.resources.map((r, i) => (
                  <li key={i}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orchid hover:underline"
                      >
                        {r.title}
                      </a>
                    ) : (
                      <span className="text-brand-light">{r.title}</span>
                    )}
                    <span className="ml-2 text-xs text-brand-steel">({r.type})</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-5 rounded-lg border border-brand-steel/20 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">Project</h3>
            <p className="mt-1 font-medium text-brand-light">{week.project.title}</p>
            <p className="mt-1 text-sm text-brand-light/90">{week.project.description}</p>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">Deliverables</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-light">
              {week.deliverables.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-steel">
              Completion criteria
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-light">
              {week.completionCriteria.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            {['not_started', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => updateWeekStatus(week.weekNumber, status)}
                disabled={updatingStatus || week.status === status}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${STATUS_STYLES[status]}`}
              >
                Mark as {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
