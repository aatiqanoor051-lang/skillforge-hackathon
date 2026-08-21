import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { unwrapError } from '../utils/api';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

const TYPE_LABELS = {
  article: 'Article',
  video: 'Video',
  course: 'Course',
  documentation: 'Docs',
  book: 'Book',
  tool: 'Tool',
  other: 'Other',
};

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', type: 'article', topics: '', difficulty: 'beginner', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadResources() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/resources');
      setResources(res.data.data.resources);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await api.post('/resources', {
        ...form,
        topics: form.topics.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setMessage(
        ['mentor', 'admin'].includes(user.role)
          ? 'Resource added and verified.'
          : 'Resource submitted for mentor/admin verification.'
      );
      setForm({ title: '', url: '', type: 'article', topics: '', difficulty: 'beginner', description: '' });
      setShowForm(false);
      loadResources();
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(id, status) {
    try {
      await api.patch(`/resources/${id}/verify`, { status });
      loadResources();
    } catch (err) {
      setError(unwrapError(err));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-light">Resource library</h1>
          <p className="mt-1 text-sm text-brand-steel">Curated learning material for closing skill gaps.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add resource'}</Button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-brand-orchid/40 bg-brand-orchid/10 px-3 py-2 text-sm text-brand-orchid">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <input
              type="url"
              required
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light focus:border-brand-orchid focus:outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light focus:border-brand-orchid focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Topics (comma separated, e.g. React, JavaScript)"
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <textarea
              placeholder="Short description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2 text-sm text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit resource'}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center text-brand-steel">Loading resources…</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-2">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-orchid hover:underline"
                >
                  {r.title}
                </a>
                <span className="whitespace-nowrap rounded-full bg-brand-steel/15 px-2 py-0.5 text-xs text-brand-light">
                  {TYPE_LABELS[r.type] || r.type}
                </span>
              </div>
              {r.description && <p className="mt-1.5 text-sm text-brand-light/80">{r.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(r.topics || []).map((t) => (
                  <span key={t} className="rounded-full bg-brand-navy px-2 py-0.5 text-[11px] text-brand-steel ring-1 ring-brand-steel/20">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    r.verificationStatus === 'verified'
                      ? 'text-green-300'
                      : r.verificationStatus === 'rejected'
                      ? 'text-red-300'
                      : 'text-brand-steel'
                  }`}
                >
                  {r.verificationStatus}
                </span>
                {['mentor', 'admin'].includes(user.role) && r.verificationStatus === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => verify(r._id, 'verified')} className="text-xs font-semibold text-green-300 hover:underline">
                      Approve
                    </button>
                    <button onClick={() => verify(r._id, 'rejected')} className="text-xs font-semibold text-red-300 hover:underline">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {resources.length === 0 && (
            <p className="col-span-full text-sm text-brand-steel">No resources yet. Be the first to add one!</p>
          )}
        </div>
      )}
    </div>
  );
}
