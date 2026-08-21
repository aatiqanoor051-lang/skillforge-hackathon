import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import RoadmapPage from './pages/RoadmapPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import MentorPage from './pages/MentorPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

import Navbar from './components/Navbar.jsx';
import AICoachWidget from './components/AICoachWidget.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function AuthedLayout({ children }) {
  return (
    <div className="min-h-screen bg-brand-navy">
      <Navbar />
      <main>{children}</main>
      <AICoachWidget />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-steel border-t-brand-orchid" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthedLayout>
              <DashboardPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AuthedLayout>
              <ProfilePage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AuthedLayout>
              <AssessmentPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AuthedLayout>
              <RoadmapPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <AuthedLayout>
              <ResourcesPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor"
        element={
          <ProtectedRoute allowedRoles={['mentor', 'admin']}>
            <AuthedLayout>
              <MentorPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuthedLayout>
              <AdminPage />
            </AuthedLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
