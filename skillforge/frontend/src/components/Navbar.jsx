import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = {
  student: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
    { to: '/assessment', label: 'Assessment' },
    { to: '/roadmap', label: 'Roadmap' },
    { to: '/resources', label: 'Resources' },
  ],
  mentor: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mentor', label: 'Students' },
    { to: '/resources', label: 'Resources' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin', label: 'Admin' },
    { to: '/resources', label: 'Resources' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = NAV_LINKS[user.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-brand-steel/30 bg-brand-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orchid text-sm font-bold text-brand-navy">
            SF
          </span>
          <span className="text-lg font-bold text-brand-light tracking-tight">SkillForge</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-orchid/15 text-brand-orchid'
                    : 'text-brand-light/80 hover:bg-brand-steel/10 hover:text-brand-light'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-brand-steel sm:inline">
            {user.name} <span className="text-brand-orchid">·</span> {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-brand-steel/40 px-3 py-1.5 text-sm font-medium text-brand-light transition-colors hover:border-brand-orchid hover:text-brand-orchid"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-brand-steel/20 px-4 py-1.5 md:hidden">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              location.pathname === link.to
                ? 'bg-brand-orchid/15 text-brand-orchid'
                : 'text-brand-light/70'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
