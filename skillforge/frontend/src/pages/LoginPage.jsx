import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(form);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orchid text-lg font-bold text-brand-navy">
            SF
          </span>
          <h1 className="text-2xl font-extrabold text-brand-light">Welcome back</h1>
          <p className="mt-1 text-sm text-brand-steel">Sign in to continue your career roadmap.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-light">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-light">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-brand-steel/30 bg-brand-navy px-3 py-2.5 text-brand-light placeholder:text-brand-steel focus:border-brand-orchid focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-brand-steel">
            New to SkillForge?{' '}
            <Link to="/register" className="font-semibold text-brand-orchid hover:underline">
              Create an account
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-xs text-brand-steel">
          Demo accounts (if seeded): demo.student@skillforge.local · demo.mentor@skillforge.local ·
          demo.admin@skillforge.local — password: DemoPass123!
        </p>
      </div>
    </div>
  );
}
