import { useEffect, useRef, useState } from 'react';
import './LiveCounter.css';

export default function LiveCounter({ count, going, onToggle, loading }) {
  const [displayCount, setDisplayCount] = useState(count);
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      prevCount.current = count;
      setDisplayCount(count);
      return () => clearTimeout(t);
    }
    setDisplayCount(count);
  }, [count]);

  return (
    <div className="live-counter glass">
      <div className="lc-live-badge">
        <span className="lc-pulse-dot" />
        <span>LIVE</span>
      </div>

      <div className="lc-main">
        <span className={`lc-number ${pop ? 'pop' : ''}`}>{displayCount}</span>
        <span className="lc-label">
          {displayCount === 1 ? 'dev heading there' : 'devs heading there'}
        </span>
      </div>

      <div className="lc-divider" />

      <button
        id="going-btn"
        className={`btn btn-lg ${going ? 'btn-going-active' : 'btn-accent'}`}
        onClick={onToggle}
        disabled={loading}
        aria-label={going ? "Cancel attendance" : "Mark as going"}
      >
        {going ? (
          <><span className="btn-icon">✓</span> You're Going!</>
        ) : (
          <><span className="btn-icon">🚀</span> I'm Going!</>
        )}
      </button>

      <p className="lc-hint">
        {going
          ? 'See you there! Counter updated anonymously.'
          : 'Tap to join the crowd — no sign-up needed.'}
      </p>
    </div>
  );
}
