import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { unwrapError } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('skillforge_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch (err) {
      localStorage.removeItem('skillforge_token');
      localStorage.removeItem('skillforge_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token, user: newUser } = res.data.data;
      localStorage.setItem('skillforge_token', token);
      localStorage.setItem('skillforge_user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (err) {
      const message = unwrapError(err);
      setAuthError(message);
      return { success: false, error: message };
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: loggedInUser } = res.data.data;
      localStorage.setItem('skillforge_token', token);
      localStorage.setItem('skillforge_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      const message = unwrapError(err);
      setAuthError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('skillforge_token');
    localStorage.removeItem('skillforge_user');
    setUser(null);
  }, []);

  const value = { user, setUser, loading, authError, setAuthError, register, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
