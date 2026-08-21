import React, { useEffect, useState } from 'react';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function MentorPage() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/mentor/students');
        setStudents(res.data.data.students);
      } catch (err) {
        setError(unwrapError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openDashboard(studentProfile) {
    setSelected(studentProfile);
    setDashboard(null);
    setDashboardLoading(true);
    setError(null);
    try {
      const res = await api.get(`/mentor/students/${studentProfile.user._id}/dashboard`);
      setDashboard(res.data.data);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setDashboardLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-light">Your students</h1>
      <p className="mt-1 text-sm text-brand-steel">Review skill gaps and roadmap progress for your students.</p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-steel">Students</h2>
          {loading ? (
            <p className="text-sm text-brand-steel">Loading…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-brand-steel">No students assigned yet.</p>
          ) : (
            <ul className="space-y-1">
              {students.map((s) => (
                <li key={s._id}>
                  <button
                    onClick={() => openDashboard(s)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selected?._id === s._id
                        ? 'bg-brand-orchid/15 text-brand-orchid'
                        : 'text-brand-light hover:bg-brand-steel/10'
                    }`}
                  >
                    <p className="font-medium">{s.user?.name}</p>
                    <p className="text-xs text-brand-steel">{s.targetRole || 'No target role set'}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2">
          {!selected && (
            <Card>
              <p className="text-sm text-brand-steel">Select a student to view their dashboard.</p>
            </Card>
          )}

          {selected && dashboardLoading && (
            <Card>
              <p className="text-sm text-brand-steel">Loading dashboard…</p>
            </Card>
          )}

          {selected && dashboard && !dashboardLoading && (
            <div className="space-y-4">
              <Card>
                <h2 className="text-lg font-semibold text-brand-light">{dashboard.profile.user.name}</h2>
                <p className="text-sm text-brand-steel">{dashboard.profile.user.email}</p>
                <p className="mt-2 text-sm text-brand-light">
                  Target role: <span className="text-brand-orchid">{dashboard.profile.targetRole || 'Not set'}</span>
                </p>
              </Card>

              <Card>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-steel">
                  Latest assessment
                </h3>
                {dashboard.latestAssessment ? (
                  <div>
                    <ProgressBar
                      value={dashboard.latestAssessment.overallScore}
                      label={dashboard.latestAssessment.targetRole}
                    />
                    <ul className="mt-3 space-y-1 text-sm text-brand-light">
                      {dashboard.latestAssessment.missingSkills.slice(0, 5).map((m) => (
                        <li key={m.skill}>
                          <span className="text-brand-orchid">{m.skill}</span> — gap of {m.gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-brand-steel">No assessment on file.</p>
                )}
              </Card>

              <Card>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-steel">
                  Roadmap progress
                </h3>
                {dashboard.latestRoadmap ? (
                  <ProgressBar
                    value={dashboard.latestRoadmap.completionPercentage}
                    label={dashboard.latestRoadmap.targetRole}
                  />
                ) : (
                  <p className="text-sm text-brand-steel">No roadmap generated yet.</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
