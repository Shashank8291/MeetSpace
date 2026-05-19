import { useState, useEffect } from 'react';
import { formatCoord, secondsUntilMidnight } from '../utils/geohash';
import './MeetCard.css';

function Countdown() {
  const [secs, setSecs] = useState(secondsUntilMidnight());
  useEffect(() => {
    const id = setInterval(() => setSecs(secondsUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return <span className="mc-countdown text-mono">{h}:{m}:{s}</span>;
}

export default function MeetCard({ meetpoint, citySlug, backendUp }) {
  if (!meetpoint) return null;

  const { lat, lon, hash, djia, date } = meetpoint;
  const coordStr = formatCoord(lat, lon);
  const mapsUrl  = `https://www.google.com/maps?q=${lat},${lon}`;

  function handleCopy() {
    navigator.clipboard?.writeText(coordStr);
  }

  return (
    <div className="meet-card glass animate-slide-up">
      {/* Header */}
      <div className="mc-header">
        <div className="mc-date-block">
          <span className="badge badge-primary">Today's MeetPoint</span>
          <p className="mc-date">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}</p>
        </div>
        <div className="mc-timer-block">
          <p className="mc-timer-label">Resets in</p>
          <Countdown />
        </div>
      </div>

      <div className="mc-divider" />

      {/* Coordinate */}
      <div className="mc-coord-section">
        <p className="mc-coord-label">📍 Coordinates</p>
        <button
          id="copy-coord-btn"
          className="mc-coord"
          onClick={handleCopy}
          title="Click to copy"
        >
          <span className="text-mono text-gradient">{coordStr}</span>
          <span className="mc-copy-icon">⎘</span>
        </button>
        <a
          id="open-maps-btn"
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ fontSize: 13, padding: '7px 16px', marginTop: 8 }}
        >
          Open in Google Maps ↗
        </a>
      </div>



      {!backendUp && (
        <div className="mc-offline">
          ⚡ Offline mode — coordinates computed locally
        </div>
      )}
    </div>
  );
}
