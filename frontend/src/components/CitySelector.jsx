import { useState, useEffect } from 'react';
import { CITIES } from '../utils/geohash';
import './CitySelector.css';

export default function CitySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cities = Object.entries(CITIES);
  const current = CITIES[value];

  useEffect(() => {
    const handler = () => setOpen(false);
    if (open) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="city-selector" onClick={e => e.stopPropagation()}>
      <button
        id="city-selector-btn"
        className="city-btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="city-icon">📍</span>
        <span className="city-name">{current?.name ?? value}</span>
        <span className={`city-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <ul className="city-dropdown glass" role="listbox">
          {cities.map(([slug, info]) => (
            <li
              key={slug}
              role="option"
              aria-selected={slug === value}
              className={`city-option ${slug === value ? 'active' : ''}`}
              onClick={() => { onChange(slug); setOpen(false); }}
            >
              <span className="city-option-dot" />
              <span>{info.name}</span>
              {slug === value && <span className="city-check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
