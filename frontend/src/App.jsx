import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import Account from './pages/Account';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

function getStoredToken() {
  return localStorage.getItem('meetspace_token');
}

function getStoredUser() {
  const raw = localStorage.getItem('meetspace_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeAuth(user, token) {
  localStorage.setItem('meetspace_token', token);
  localStorage.setItem('meetspace_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('meetspace_token');
  localStorage.removeItem('meetspace_user');
}

export default function App() {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser]   = useState(getStoredUser());
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`${API_BASE}/auth/me/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setUser(response.data.user);
        storeAuth(response.data.user, token);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function handleAuthSuccess(userData, authToken) {
    setUser(userData);
    setToken(authToken);
    storeAuth(userData, authToken);
  }

  function handleLogout() {
    clearAuth();
    setUser(null);
    setToken(null);
  }

  if (loading) {
    return <div className="loading-screen">Checking your account…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — shown to guests; logged-in users go to dashboard */}
        <Route
          path="/"
          element={user ? <Home user={user} onLogout={handleLogout} /> : <LandingPage />}
        />

        {/* Auth — login/register (redirect to dashboard if already logged in) */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Auth onAuthSuccess={handleAuthSuccess} />}
        />

        {/* Account Details */}
        <Route
          path="/account"
          element={user ? <Account user={user} onUpdateSuccess={(userData) => handleAuthSuccess(userData, token)} /> : <Navigate to="/login" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={user ? '/' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
