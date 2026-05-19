import { useNavigate } from 'react-router-dom';
import UnauthNav from '../components/UnauthNav';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📍',
    title: 'Daily MeetPoints',
    desc: 'A unique location is generated every day using the xkcd geohash algorithm — unpredictable, exciting, and city-specific.',
  },
  {
    icon: '💬',
    title: 'Community Chat',
    desc: 'Talk to developers and tech enthusiasts in your city who are heading to the same spot. Real-time, anonymous, fun.',
  },
  {
    icon: '🏙️',
    title: '9 Cities & Growing',
    desc: 'MeetPoints are live in Bangalore, Mumbai, Delhi, Hyderabad, Pune, Chennai, SF, London, and New York.',
  },
  {
    icon: '🔐',
    title: 'Members Only',
    desc: 'Register once with your name, phone, and email. Only verified members can access the platform and join meetups.',
  },
];

const CITIES = [
  { emoji: '💻', name: 'Bangalore' },
  { emoji: '☕', name: 'Mumbai' },
  { emoji: '🏛️', name: 'Delhi' },
  { emoji: '🍽️', name: 'Hyderabad' },
  { emoji: '🎓', name: 'Pune' },
  { emoji: '🌊', name: 'Chennai' },
  { emoji: '🌉', name: 'San Francisco' },
  { emoji: '🎡', name: 'London' },
  { emoji: '🗽', name: 'New York' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <UnauthNav />

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="land-hero-glow" />
        <div className="land-hero-inner">
          <div className="land-eyebrow">
            <span className="land-badge">✦ Zero effort. Real connections.</span>
          </div>
          <h1 className="land-hero-title">
            Find your tribe.<br />
            <span className="land-gradient-text">Meet today.</span>
          </h1>
          <p className="land-hero-sub">
            MeetSpace generates a unique meetup location in your city every single day.
            Show up, meet developers, make things happen.
          </p>
          <div className="land-hero-cta">
            <button
              id="hero-get-started-btn"
              className="land-btn-primary land-btn-lg"
              onClick={() => navigate('/login?tab=register')}
            >
              Create Free Account
            </button>
            <button
              id="hero-sign-in-btn"
              className="land-btn-ghost land-btn-lg"
              onClick={() => navigate('/login?tab=login')}
            >
              Already a member? Sign in
            </button>
          </div>

          {/* Floating city chips */}
          <div className="land-cities-strip">
            {CITIES.map((c) => (
              <span key={c.name} className="land-city-chip">
                {c.emoji} {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="information" className="land-features">
        <div className="land-section-inner">
          <div className="land-section-label">Why MeetSpace</div>
          <h2 className="land-section-title">
            Spontaneous meetups,<br />
            <span className="land-gradient-text">powered by math.</span>
          </h2>
          <div className="land-feat-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="land-feat-card glass">
                <span className="land-feat-icon">{f.icon}</span>
                <h3 className="land-feat-title">{f.title}</h3>
                <p className="land-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="land-how">
        <div className="land-section-inner">
          <div className="land-section-label">How it works</div>
          <h2 className="land-section-title">Three steps to your next meetup</h2>
          <div className="land-steps">
            {[
              { n: '01', title: 'Register', desc: 'Create your account with your name, phone, and email. Upload a profile photo.' },
              { n: '02', title: 'Pick your city', desc: 'Choose from 9 cities. A unique geohash location is computed fresh every day.' },
              { n: '03', title: 'Show up', desc: 'Mark yourself as going, chat with others, copy coords, and head to the spot.' },
            ].map((s) => (
              <div key={s.n} className="land-step glass">
                <span className="land-step-n">{s.n}</span>
                <h3 className="land-step-title">{s.title}</h3>
                <p className="land-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="land-cta-banner">
        <div className="land-cta-glow" />
        <div className="land-section-inner land-cta-content">
          <h2 className="land-cta-title">Ready to meet your city?</h2>
          <p className="land-cta-sub">Join MeetSpace today — it's free, it's for devs, and it's happening right now.</p>
          <button
            id="cta-banner-btn"
            className="land-btn-primary land-btn-lg"
            onClick={() => navigate('/login?tab=register')}
          >
            Create Your Account →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-brand">
            <span className="land-logo">⟨M⟩</span>
            <span className="land-brand-name">MeetSpace</span>
          </div>
          <p className="land-footer-copy">
            © {new Date().getFullYear()} MeetSpace · Built for spontaneous humans · No tracking
          </p>
        </div>
      </footer>
    </div>
  );
}
