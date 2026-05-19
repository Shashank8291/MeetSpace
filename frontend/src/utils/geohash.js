/**
 * Client-side xkcd Geohash implementation.
 * Mirrors the backend's compute_geohash() for offline fallback.
 */
import SparkMD5 from 'spark-md5';

export const CITIES = {
  'mumbai':        { name: 'Mumbai',        lat: 19, lon: 72,   center: [19.076,  72.877]  },
  'bangalore':     { name: 'Bengaluru',     lat: 12, lon: 77,   center: [12.971,  77.594]  },
  'delhi':         { name: 'New Delhi',     lat: 28, lon: 77,   center: [28.613,  77.209]  },
  'hyderabad':     { name: 'Hyderabad',     lat: 17, lon: 78,   center: [17.385,  78.486]  },
  'pune':          { name: 'Pune',          lat: 18, lon: 73,   center: [18.520,  73.856]  },
  'chennai':       { name: 'Chennai',       lat: 13, lon: 80,   center: [13.082,  80.270]  },
  'san-francisco': { name: 'San Francisco', lat: 37, lon: -122, center: [37.774,  -122.419]},
  'london':        { name: 'London',        lat: 51, lon: 0,    center: [51.507,  -0.127]  },
  'new-york':      { name: 'New York',      lat: 40, lon: -74,  center: [40.712,  -74.006] },
};

/** Hex string → float in [0, 1) */
function hexFrac(hex16) {
  // Parse as BigInt to handle full 64-bit precision
  const val = BigInt('0x' + hex16);
  const max = BigInt('0x' + 'f'.repeat(16));
  return Number(val) / (Number(max) + 1);
}

/** Deterministic mock DJIA for a date string */
export function getMockDJIA(dateStr) {
  const h = SparkMD5.hash(`djia-seed-${dateStr}`);
  const frac = hexFrac(h.slice(0, 16));
  return +(30000 + frac * 10000).toFixed(2);
}

/** Compute today's MeetPoint coordinate for a city */
export function computeGeohash(dateStr, citySlug) {
  const city = CITIES[citySlug];
  if (!city) throw new Error(`Unknown city: ${citySlug}`);

  const djia = getMockDJIA(dateStr);
  const hashInput = `${dateStr}-${djia}`;
  const md5hex = SparkMD5.hash(hashInput); // 32-char hex

  const latFrac = hexFrac(md5hex.slice(0, 16));
  const lonFrac = hexFrac(md5hex.slice(16));

  return {
    lat:      +(city.lat + latFrac).toFixed(6),
    lon:      +(city.lon + lonFrac).toFixed(6),
    djia,
    hash:     md5hex,
    citySlug,
    cityName: city.name,
    date:     dateStr,
  };
}

/** Format coordinate for display */
export function formatCoord(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
}

/** Get today's date string YYYY-MM-DD in local time */
export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Seconds until next midnight reset */
export function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}
