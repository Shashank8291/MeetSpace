import { useNavigate, useLocation } from 'react-router-dom';
import './UnauthNav.css';

export default function UnauthNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleInfoClick = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/#information');
    } else {
      const section = document.getElementById('information');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="unauth-nav glass">
      <div className="unauth-nav-inner">
        <div className="unauth-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="unauth-logo">⟨M⟩</span>
          <span className="unauth-brand-name">MeetSpace</span>
        </div>
        <div className="unauth-links">
          <button className="unauth-link" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="unauth-link" onClick={handleInfoClick}>
            Information
          </button>
          <button className="unauth-link btn-primary-small" onClick={() => navigate('/login?tab=login')}>
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
