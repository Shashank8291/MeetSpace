import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CitySelector from '../components/CitySelector';
import MeetCard from '../components/MeetCard';
import LiveCounter from '../components/LiveCounter';
import MapView from '../components/MapView';
import ChatPanel from '../components/ChatPanel';
import { useMeetPoint } from '../hooks/useMeetPoint';
import { useChat } from '../hooks/useChat';
import { CITIES } from '../utils/geohash';
import './Home.css';

export default function Home({ user, onLogout }) {
  const [city, setCity] = useState('bangalore');
  const [chatOpen, setChatOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { meetpoint, count, going, loading, error, backendUp, toggleGoing } =
    useMeetPoint(city);
  const { unread } = useChat(city, chatOpen);

  const cityName = CITIES[city]?.name ?? city;

  function showToast(msg, type = 'info') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggle() {
    await toggleGoing();
    showToast(
      going ? "Removed from today's list 👋" : 'Awesome! You\'re counted 🎉',
      going ? 'info' : 'success'
    );
  }

  return (
    <div className={`home ${chatOpen ? 'chat-open' : ''}`}>
      <nav className="navbar glass">
        <div className="nav-inner container">
          <div className="nav-brand">
            <span className="nav-logo">⟨M⟩</span>
            <span className="nav-title">MeetSpace</span>
          </div>
          <div className="nav-right">
            <div className="user-chip" ref={dropdownRef}>
              <button 
                className="user-avatar-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="User Avatar" className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-fallback">{user?.name?.charAt(0).toUpperCase()}</div>
                )}
                <span className="user-name">{user?.name}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {dropdownOpen && (
                <div className="user-dropdown-menu glass">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate('/account')}>
                    👤 Account
                  </button>
                  <button className="dropdown-item logout-item" onClick={onLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
            <CitySelector value={city} onChange={setCity} />
            <button
              id="chat-toggle-btn"
              className={`chat-toggle-btn ${chatOpen ? 'active' : ''}`}
              onClick={() => setChatOpen((o) => !o)}
              aria-label="Toggle community chat"
            >
              <span>💬</span>
              <span className="chat-btn-label">Community</span>
              {unread > 0 && !chatOpen && (
                <span className="chat-unread-badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <header className="hero container">
        <div className="hero-eyebrow">
          <span className="badge badge-primary">Welcome back</span>
          {!backendUp && (
            <span
              className="badge"
              style={{
                background: 'rgba(245,158,11,0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(245,158,11,0.25)',
                fontSize: 11,
              }}
            >
              ⚡ Offline Mode
            </span>
          )}
        </div>
        <h1 className="hero-title">
          Find local meetups<br />
          <span className="text-gradient">right when you want them.</span>
        </h1>
        <p className="hero-sub">
          See today’s meetup location, join the community, and save your attendance.
          Only registered members can log in and participate.
        </p>
      </header>

      <main className="main-grid container">
        <div className="col-left">
          {loading ? (
            <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius)' }} />
          ) : error ? (
            <div className="error-card glass"><p>⚠️ {error}</p></div>
          ) : (
            <MeetCard meetpoint={meetpoint} citySlug={city} backendUp={backendUp} />
          )}
          <MapView meetpoint={meetpoint} count={count} />
        </div>

        <div className="col-right">
          {loading ? (
            <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius)' }} />
          ) : (
            <LiveCounter count={count} going={going} onToggle={handleToggle} loading={loading} />
          )}

          <button className="community-cta glass" onClick={() => setChatOpen(true)}>
            <div className="cta-left">
              <span className="cta-icon">💬</span>
              <div>
                <p className="cta-title">Join the {cityName} chat</p>
                <p className="cta-sub">Talk to devs heading to today's spot</p>
              </div>
            </div>
            <span className="cta-arrow">→</span>
          </button>

          <div className="locations-card glass">
            <div className="loc-header">
              <h2 className="loc-title">📍 Meeting Locations</h2>
              <span className="loc-sub">Switch cities to explore MeetPoints</span>
            </div>
            <div className="loc-grid">
              {Object.entries(CITIES).map(([slug, info]) => {
                const isActive = slug === city;
                const types = {
                  mumbai: { emoji: '☕', tag: 'Café Culture' },
                  bangalore: { emoji: '💻', tag: 'Tech Hub' },
                  delhi: { emoji: '🏛️', tag: 'Metro Hub' },
                  hyderabad: { emoji: '🍽️', tag: 'Food Trail' },
                  pune: { emoji: '🎓', tag: 'Campus Zone' },
                  chennai: { emoji: '🌊', tag: 'Coastal' },
                  'san-francisco': { emoji: '🌉', tag: 'Bay Area' },
                  london: { emoji: '🎡', tag: 'City Centre' },
                  'new-york': { emoji: '🗽', tag: 'Downtown' },
                };
                const t = types[slug] || { emoji: '📍', tag: 'City' };
                return (
                  <button
                    key={slug}
                    className={`loc-card ${isActive ? 'loc-active' : ''}`}
                    onClick={() => setCity(slug)}
                  >
                    <span className="loc-emoji">{t.emoji}</span>
                    <span className="loc-name">{info.name}</span>
                    <span className="loc-tag">{t.tag}</span>
                    {isActive && <span className="loc-badge">Active</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer container">
        <p>© {new Date().getFullYear()} MeetSpace · Built for spontaneous humans · No data collected</p>
      </footer>

      <ChatPanel citySlug={city} cityName={cityName} open={chatOpen} onClose={() => setChatOpen(false)} />

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
