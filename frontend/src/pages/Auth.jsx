import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import UnauthNav from '../components/UnauthNav';
import './Auth.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

function formatError(error) {
  const message = error?.response?.data?.error || error?.message || 'Something went wrong.';
  return typeof message === 'string' ? message : JSON.stringify(message);
}

/* ── Avatar Picker Modal ───────────────────────────────────── */
function AvatarModal({ onClose, onFileSelected }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  function pickGallery() {
    galleryRef.current?.click();
  }
  function pickCamera() {
    cameraRef.current?.click();
  }
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      onClose();
    }
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="avatar-modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className="avatar-modal-card glass">
        <div className="avatar-modal-header">
          <h3 className="avatar-modal-title">Profile Photo</h3>
          <button className="avatar-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="avatar-modal-sub">Choose how to add your profile picture</p>

        <div className="avatar-modal-options">
          <button id="avatar-gallery-btn" className="avatar-option-btn" onClick={pickGallery}>
            <span className="avatar-opt-icon">🖼️</span>
            <span className="avatar-opt-label">Upload from Gallery</span>
            <span className="avatar-opt-hint">JPG, PNG, WEBP</span>
          </button>
          <button id="avatar-camera-btn" className="avatar-option-btn" onClick={pickCamera}>
            <span className="avatar-opt-icon">📷</span>
            <span className="avatar-opt-label">Take a Photo</span>
            <span className="avatar-opt-hint">Use your camera</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

/* ── Main Auth Component ───────────────────────────────────── */
export default function Auth({ onAuthSuccess }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [tab, setTab]                         = useState(initialTab);
  const [loginEmail, setLoginEmail]           = useState('');
  const [loginPassword, setLoginPassword]     = useState('');
  const [registerName, setRegisterName]       = useState('');
  const [registerPhone, setRegisterPhone]     = useState('');
  const [registerEmail, setRegisterEmail]     = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerAvatar, setRegisterAvatar]   = useState(null);
  const [avatarPreview, setAvatarPreview]     = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const navigate = useNavigate();

  // Clear error when switching tabs
  useEffect(() => { setError(''); }, [tab]);

  function handleAvatarSelected(file) {
    setRegisterAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /* ── Login ── */
  async function submitLogin(e) {
    e.preventDefault();
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login/`, {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      onAuthSuccess(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Register ── */
  async function submitRegister(e) {
    e.preventDefault();
    setError('');
    if (!registerName.trim() || !registerPhone.trim() || !registerEmail.trim() || !registerPassword) {
      setError('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name',     registerName.trim());
    formData.append('phone',    registerPhone.trim());
    formData.append('email',    registerEmail.trim().toLowerCase());
    formData.append('password', registerPassword);
    if (registerAvatar) {
      formData.append('avatar',   registerAvatar);
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register/`, formData);
      onAuthSuccess(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <UnauthNav />
      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-left-content">
          <h1 className="auth-left-title" style={{ marginTop: '40px' }}>
            Your city.<br />
            Your tribe.<br />
            <span className="auth-left-accent">Every day.</span>
          </h1>
          <p className="auth-left-sub">
            A new meetup location, generated daily using the xkcd geohash algorithm.
            Only registered members can join.
          </p>
          <div className="auth-left-pills">
            {['📍 Daily MeetPoints', '💬 Community Chat', '🏙️ 9 Cities', '🔐 Members Only'].map((p) => (
              <span key={p} className="auth-pill">{p}</span>
            ))}
          </div>
        </div>
        <div className="auth-left-glow" />
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          {/* Tab switcher */}
          <div className="auth-tabs" role="tablist">
            <button
              id="tab-login-btn"
              role="tab"
              aria-selected={tab === 'login'}
              className={`auth-tab ${tab === 'login' ? 'auth-tab-active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              id="tab-register-btn"
              role="tab"
              aria-selected={tab === 'register'}
              className={`auth-tab ${tab === 'register' ? 'auth-tab-active' : ''}`}
              onClick={() => setTab('register')}
            >
              Create Account
            </button>
            <div className={`auth-tab-indicator ${tab === 'register' ? 'auth-tab-indicator-right' : ''}`} />
          </div>

          {/* Error banner */}
          {error && <div className="auth-error" role="alert">{error}</div>}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={submitLogin} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password" className="auth-label">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="auth-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                id="login-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-loading-dots">Signing in<span>.</span><span>.</span><span>.</span></span>
                ) : (
                  'Sign In →'
                )}
              </button>
              <p className="auth-switch-hint">
                No account?{' '}
                <button type="button" className="auth-link-btn" onClick={() => setTab('register')}>
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={submitRegister} className="auth-form" noValidate>
              {/* Avatar picker */}
              <div className="auth-avatar-row">
                <button
                  type="button"
                  id="avatar-picker-btn"
                  className="auth-avatar-btn"
                  onClick={() => setShowAvatarModal(true)}
                  aria-label="Add profile photo"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile preview" className="auth-avatar-preview" />
                  ) : (
                    <span className="auth-avatar-placeholder">📷</span>
                  )}
                  <span className="auth-avatar-overlay">
                    {avatarPreview ? '✏️ Change' : '+ Add Photo'}
                  </span>
                </button>
                <div className="auth-avatar-info">
                  <span className="auth-avatar-label">Profile Photo</span>
                  <span className="auth-avatar-hint">Optional — click the icon to upload or take a photo</span>
                </div>
              </div>

              <div className="auth-fields-grid">
                <div className="auth-field">
                  <label htmlFor="reg-name" className="auth-label">Full Name <span className="auth-required">*</span></label>
                  <input
                    id="reg-name"
                    type="text"
                    className="auth-input"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="reg-phone" className="auth-label">Phone Number <span className="auth-required">*</span></label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className="auth-input"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email" className="auth-label">
                  Email Address <span className="auth-required">*</span>
                  <span className="auth-label-note">(used as username)</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password" className="auth-label">Password <span className="auth-required">*</span></label>
                <input
                  id="reg-password"
                  type="password"
                  className="auth-input"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-loading-dots">Creating account<span>.</span><span>.</span><span>.</span></span>
                ) : (
                  'Create Account →'
                )}
              </button>

              <p className="auth-switch-hint">
                Already registered?{' '}
                <button type="button" className="auth-link-btn" onClick={() => setTab('login')}>
                  Sign in here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Avatar modal */}
      {showAvatarModal && (
        <AvatarModal
          onClose={() => setShowAvatarModal(false)}
          onFileSelected={handleAvatarSelected}
        />
      )}
    </div>
  );
}
