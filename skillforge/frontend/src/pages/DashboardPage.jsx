import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, historyRes, roadmapRes] = await Promise.all([
          api.get('/profile'),
          api.get('/assessment/history'),
          api.get('/roadmap/latest'),
        ]);
        setProfile(profileRes.data.data.profile);
        setAssessments(historyRes.data.data.assessments);
        setRoadmap(roadmapRes.data.data.roadmap);
      } catch (err) {
        setError(unwrapError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="py-16 text-center text-brand-steel">Loading dashboard…</div>;

  const latestAssessment = assessments[0];

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {!profile?.onboardingComplete && (
        <Card className="border-brand-orchid/40">
          <p className="text-sm text-brand-light">
            Finish setting up your profile (target role and current skills) to unlock accurate assessments.
          </p>
          <Link to="/profile">
            <Button className="mt-3">Complete profile</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-brand-light">Latest readiness</h2>
          {latestAssessment ? (
            <div className="mt-3">
              <ProgressBar value={latestAssessment.overallScore} label={latestAssessment.targetRole} />
              <p className="mt-2 text-xs text-brand-steel">
                {new Date(latestAssessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-brand-steel">No assessments yet.</p>
          )}
          <Link to="/assessment">
            <Button variant="secondary" className="mt-4">
              {latestAssessment ? 'Retake assessment' : 'Take your first assessment'}
            </Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-brand-light">Roadmap progress</h2>
          {roadmap ? (
            <div className="mt-3">
              <ProgressBar value={roadmap.completionPercentage} label={roadmap.targetRole} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-brand-steel">No roadmap generated yet.</p>
          )}
          <Link to="/roadmap">
            <Button variant="secondary" className="mt-4">
              View roadmap
            </Button>
          </Link>
        </Card>
      </div>

      {assessments.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-brand-light">Assessment history</h2>
          <ul className="divide-y divide-brand-steel/15">
            {assessments.slice(0, 5).map((a) => (
              <li key={a._id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-brand-light">{a.targetRole}</span>
                <span className="text-brand-steel">{new Date(a.createdAt).toLocaleDateString()}</span>
                <span className="font-semibold text-brand-orchid">{Math.round(a.overallScore)}%</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="py-16 text-center text-brand-steel">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <Card>
        <h2 className="text-lg font-semibold text-brand-light">Your students</h2>
        <p className="mt-1 text-sm text-brand-steel">{students.length} assigned student(s)</p>
        <Link to="/mentor">
          <Button className="mt-4">View student dashboards</Button>
        </Link>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-brand-light">Admin console</h2>
      <p className="mt-1 text-sm text-brand-steel">
        Manage users, quiz questions, and role requirements.
      </p>
      <Link to="/admin">
        <Button className="mt-4">Open admin console</Button>
      </Link>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-light">Welcome back, {user.name.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-brand-steel capitalize">{user.role} dashboard</p>

      <div className="mt-6">
        {user.role === 'student' && <StudentDashboard />}
        {user.role === 'mentor' && <MentorDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}
