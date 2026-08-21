import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute
 * Client-side route guard for navigation UX only. The server is the
 * real enforcement point for authentication and RBAC (see backend
 * middleware/authMiddleware.js and roleMiddleware.js) — this component
 * only prevents rendering a page the user isn't allowed to see.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-steel border-t-brand-orchid" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
