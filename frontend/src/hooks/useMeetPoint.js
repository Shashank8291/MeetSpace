import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { computeGeohash, todayString, CITIES } from '../utils/geohash';

const API_BASE = '/api';   // Proxied through Vite → http://localhost:8000
const POLL_MS  = 15_000;   // live-count polling interval

function getOrCreateSessionId() {
  let sid = localStorage.getItem('ms_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('ms_session_id', sid);
  }
  return sid;
}

export function useMeetPoint(citySlug) {
  const [meetpoint, setMeetpoint] = useState(null);
  const [count, setCount]         = useState(0);
  const [going, setGoing]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [backendUp, setBackendUp] = useState(true);
  const sessionId = useRef(getOrCreateSessionId()).current;
  const pollRef   = useRef(null);

  /** Fetch or compute meetpoint */
  const fetchMeetpoint = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/meetpoint/?city=${citySlug}`, { timeout: 4000 });
      setMeetpoint(data);
      setBackendUp(true);

      // Fetch initial attendance
      const { data: att } = await axios.get(
        `${API_BASE}/attendance/count/?meetpoint_id=${data.id}&session_id=${sessionId}`,
        { timeout: 4000 }
      );
      setCount(att.count);
      setGoing(att.going);
    } catch {
      // Backend offline → use client-side computation
      setBackendUp(false);
      try {
        const geo = computeGeohash(todayString(), citySlug);
        setMeetpoint({ ...geo, id: null, attendance_count: 0 });
        const localGoing = !!localStorage.getItem(`ms_going_${citySlug}_${todayString()}`);
        const localCount = parseInt(localStorage.getItem(`ms_count_${citySlug}_${todayString()}`) || '0', 10);
        setGoing(localGoing);
        setCount(localCount);
      } catch (e) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [citySlug, sessionId]);

  /** Live count polling */
  const pollCount = useCallback(async () => {
    if (!meetpoint?.id || !backendUp) return;
    try {
      const { data } = await axios.get(
        `${API_BASE}/attendance/count/?meetpoint_id=${meetpoint.id}&session_id=${sessionId}`,
        { timeout: 4000 }
      );
      setCount(data.count);
      setGoing(data.going);
    } catch { /* swallow */ }
  }, [meetpoint?.id, sessionId, backendUp]);

  /** Toggle "I'm Going!" */
  const toggleGoing = useCallback(async () => {
    if (backendUp && meetpoint?.id) {
      try {
        const { data } = await axios.post(`${API_BASE}/attendance/`, {
          session_id: sessionId,
          meetpoint_id: meetpoint.id,
        });
        setGoing(data.going);
        setCount(data.count);
      } catch { /* swallow */ }
    } else {
      // Local-only toggle
      const newGoing = !going;
      const dateKey = `ms_going_${citySlug}_${todayString()}`;
      const countKey = `ms_count_${citySlug}_${todayString()}`;
      const newCount = Math.max(0, count + (newGoing ? 1 : -1));
      localStorage.setItem(dateKey, newGoing ? '1' : '');
      localStorage.setItem(countKey, String(newCount));
      setGoing(newGoing);
      setCount(newCount);
    }
  }, [backendUp, meetpoint, sessionId, going, count, citySlug]);

  // Initial fetch
  useEffect(() => { fetchMeetpoint(); }, [fetchMeetpoint]);

  // Set up polling
  useEffect(() => {
    pollRef.current = setInterval(pollCount, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [pollCount]);

  return { meetpoint, count, going, loading, error, backendUp, toggleGoing, sessionId };
}
