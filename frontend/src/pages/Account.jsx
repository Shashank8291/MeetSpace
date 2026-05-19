import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Account.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export default function Account({ user, onUpdateSuccess }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      const token = localStorage.getItem('meetspace_token');
      const res = await axios.put(`${API_BASE}/auth/me/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        }
      });
      
      onUpdateSuccess(res.data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Update failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <nav className="account-nav glass">
        <div className="account-nav-inner">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
          <span className="account-nav-title">Account Details</span>
          <div style={{ width: '130px' }}></div> {/* Spacer for flex balance */}
        </div>
      </nav>

      <main className="account-main">
        <div className="account-card glass-2 animate-slide-up">
          <div className="account-header">
            <div className="account-avatar-wrapper">
              <img 
                src={avatarPreview || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="account-avatar"
              />
              {editing && (
                <label className="avatar-edit-overlay">
                  ✏️
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              )}
            </div>
            <h2 className="account-title">{user?.name}</h2>
            <p className="account-subtitle">{user?.email}</p>
          </div>

          {error && <div className="account-alert error">{error}</div>}
          {success && <div className="account-alert success">{success}</div>}

          <form className="account-details" onSubmit={handleSave}>
            <div className="account-field">
              <label>Full Name</label>
              {editing ? (
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="account-input"
                  required
                />
              ) : (
                <div className="account-value">{user?.name}</div>
              )}
            </div>

            <div className="account-field">
              <label>Email Address</label>
              <div className="account-value text-disabled">
                {user?.email} <span className="locked-badge">Locked</span>
              </div>
            </div>

            <div className="account-field">
              <label>Phone Number</label>
              {editing ? (
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="account-input"
                  required
                />
              ) : (
                <div className="account-value">{user?.phone || 'Not provided'}</div>
              )}
            </div>

            <div className="account-actions">
              {editing ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => {
                    setEditing(false);
                    setName(user?.name);
                    setPhone(user?.phone);
                    setAvatarPreview(user?.avatar_url);
                    setAvatar(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
