import React, { useEffect, useState } from 'react';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'quiz', label: 'Quiz bank' },
  { id: 'roles', label: 'Role requirements' },
];

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data.users);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id, role) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      load();
    } catch (err) {
      setError(unwrapError(err));
    }
  }

  async function toggleActive(id, isActive) {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !isActive });
      load();
    } catch (err) {
      setError(unwrapError(err));
    }
  }

  if (loading) return <p className="text-sm text-brand-steel">Loading users…</p>;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-steel/20 text-brand-steel">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-brand-steel/10">
                <td className="py-2 pr-3 text-brand-light">
                  {u.name} {u.isDemoAccount && <span className="text-xs text-brand-orchid">(demo)</span>}
                </td>
                <td className="py-2 pr-3 text-brand-steel">{u.email}</td>
                <td className="py-2 pr-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="rounded-md border border-brand-steel/30 bg-brand-navy px-2 py-1 text-xs text-brand-light"
                  >
                    <option value="student">student</option>
                    <option value="mentor">mentor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <span className={u.isActive ? 'text-green-300' : 'text-red-300'}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <button
                    onClick={() => toggleActive(u._id, u.isActive)}
                    className="text-xs font-semibold text-brand-orchid hover:underline"
                  >
                    {u.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuizTab() {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    topic: '',
    difficulty: 'easy',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    applicableRoles: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/quiz-questions');
      setQuestions(res.data.data.questions);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/quiz-questions', {
        ...form,
        options: form.options.map((o) => o.trim()).filter(Boolean),
        applicableRoles: form.applicableRoles.split(',').map((r) => r.trim()).filter(Boolean),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/admin/quiz-questions/${id}`);
      load();
    } catch (err) {
      setError(unwrapError(err));
    }
  }

  if (loading) return <p className="text-sm text-brand-steel">Loading questions…</p>;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <Button onClick={() => setShowForm((v) => !v)} className="mb-4">
        {showForm ? 'Cancel' : '+ Add question'}
      </Button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-brand-steel/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light focus:border-brand-orchid focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <textarea
            required
            placeholder="Question text"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
          />
          {form.options.map((opt, idx) => (
            <input
              key={idx}
              required
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => {
                const options = [...form.options];
                options[idx] = e.target.value;
                setForm({ ...form, options });
              }}
              className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
          ))}
          <input
            required
            placeholder="Correct answer (must exactly match one option)"
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
            className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
          />
          <textarea
            required
            placeholder="Explanation"
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
          />
          <input
            required
            placeholder="Applicable roles (comma separated)"
            value={form.applicableRoles}
            onChange={(e) => setForm({ ...form, applicableRoles: e.target.value })}
            className="w-full rounded-md border border-brand-steel/30 bg-brand-navy px-2.5 py-1.5 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save question'}
          </Button>
        </form>
      )}

      <ul className="space-y-2">
        {questions.map((q) => (
          <li key={q._id} className="rounded-lg border border-brand-steel/20 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-brand-light">{q.question}</p>
                <p className="mt-1 text-xs text-brand-steel">
                  {q.topic} · {q.difficulty} · {q.applicableRoles.join(', ')}
                </p>
              </div>
              <button onClick={() => remove(q._id)} className="text-xs font-semibold text-red-300 hover:underline">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/admin/role-requirements');
      setRoles(res.data.data.roles);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-sm text-brand-steel">Loading role requirements…</p>;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {roles.length === 0 ? (
        <p className="text-sm text-brand-steel">
          No role requirements seeded yet. Run the backend seed script (npm run seed) to load the default
          catalog, or add one manually via the API.
        </p>
      ) : (
        <div className="space-y-3">
          {roles.map((r) => (
            <div key={r._id} className="rounded-lg border border-brand-steel/20 p-3">
              <p className="font-semibold text-brand-light">{r.role}</p>
              <p className="text-xs text-brand-steel">{r.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.requiredSkills.map((s) => (
                  <span key={s.skill} className="rounded-full bg-brand-steel/15 px-2 py-0.5 text-xs text-brand-light">
                    {s.skill} ≥ {s.minProficiency}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-light">Admin console</h1>
      <p className="mt-1 text-sm text-brand-steel">Manage users, quiz bank, and target role benchmarks.</p>

      <div className="mt-6 flex gap-2 border-b border-brand-steel/20">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-brand-orchid text-brand-orchid'
                : 'border-transparent text-brand-steel hover:text-brand-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="mt-6">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'quiz' && <QuizTab />}
        {activeTab === 'roles' && <RolesTab />}
      </Card>
    </div>
  );
}
