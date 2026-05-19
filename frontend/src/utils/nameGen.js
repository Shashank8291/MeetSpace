/**
 * Deterministic anonymous name generator for MeetSpace.
 * Always produces the same name for the same session UUID.
 */

const ADJECTIVES = [
  'Turbo', 'Cyber', 'Pixel', 'Neon', 'Quantum', 'Neo', 'Void',
  'Hyper', 'Flux', 'Byte', 'Ultra', 'Meta', 'Core', 'Glitch', 'Apex',
  'Nano', 'Zen', 'Ghost', 'Rogue', 'Nova',
];

const NOUNS = [
  'Wolf', 'Hawk', 'Snake', 'Fox', 'Dev', 'Node', 'Root',
  'Grid', 'Spark', 'Loop', 'Byte', 'Cipher', 'Monk', 'Drone', 'Coder',
  'Stack', 'Shell', 'Bit', 'Echo', 'Wren',
];

/**
 * Generate a fun anonymous name from a session UUID string.
 * e.g. "TurboWolf#4821"
 */
export function generateAnonName(sessionId) {
  const hex = sessionId.replace(/-/g, '');
  const adjIdx  = parseInt(hex.slice(0, 2), 16) % ADJECTIVES.length;
  const nounIdx = parseInt(hex.slice(2, 4), 16) % NOUNS.length;
  const num     = (parseInt(hex.slice(4, 8), 16) % 9000) + 1000;
  return `${ADJECTIVES[adjIdx]}${NOUNS[nounIdx]}#${num}`;
}

/**
 * Derive a deterministic HSL hue from a name string (for avatar colors).
 */
export function nameToHue(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 360) + 360) % 360;
}

/**
 * Format a relative time string: "just now", "2m ago", "1h ago"
 */
export function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
