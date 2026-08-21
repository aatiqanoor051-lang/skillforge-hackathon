import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orchid text-xl font-bold text-brand-navy">
        SF
      </span>
      <h1 className="max-w-2xl text-3xl font-extrabold text-brand-light sm:text-4xl">
        Know your skill gaps. Close them with a plan.
      </h1>
      <p className="mt-4 max-w-xl text-brand-steel">
        SkillForge assesses your current skills against your target tech role, then builds you a
        personalized 4-week learning roadmap — grounded, actionable, and reviewed by mentors.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/register">
          <Button>Get started</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
