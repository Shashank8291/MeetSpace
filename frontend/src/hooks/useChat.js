import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { generateAnonName } from '../utils/nameGen';

const POLL_OPEN_MS   = 3_000;   // poll interval when panel is open
const POLL_CLOSED_MS = 30_000;  // poll interval when panel is closed

function getSessionId() {
  let sid = localStorage.getItem('ms_session_id');
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('ms_session_id', sid); }
  return sid;
}

export function useChat(citySlug, panelOpen) {
  const sessionId   = useRef(getSessionId()).current;
  const anonName    = useRef(generateAnonName(sessionId)).current;
  const [messages,  setMessages]  = useState([]);
  const [online,    setOnline]    = useState(0);
  const [unread,    setUnread]    = useState(0);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState(null);
  const lastIdRef   = useRef(0);
  const pollRef     = useRef(null);
  const isFirstLoad = useRef(true);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const params = new URLSearchParams({ city: citySlug, session_id: sessionId });
      if (lastIdRef.current) params.set('after_id', lastIdRef.current);

      const { data } = await axios.get(`/api/chat/?${params}`, { timeout: 5000 });
      const newMsgs  = data.messages ?? [];
      const online   = data.online   ?? 0;

      setOnline(online);
      if (!newMsgs.length) return;

      // Track unread only after first load and only when panel is closed
      if (!isFirstLoad.current && !panelOpen) {
        setUnread(u => u + newMsgs.length);
      }
      isFirstLoad.current = false;

      setMessages(prev => {
        // Merge: avoid duplicates
        const existing = new Set(prev.map(m => m.id));
        const merged   = [...prev, ...newMsgs.filter(m => !existing.has(m.id))];
        // Keep last 200 messages in memory
        return merged.slice(-200);
      });

      lastIdRef.current = newMsgs[newMsgs.length - 1].id;
      if (!silent) setError(null);
    } catch (e) {
      if (!silent) setError('Could not reach chat server');
    }
  }, [citySlug, sessionId, panelOpen]);

  // Reset on city change
  useEffect(() => {
    setMessages([]);
    setUnread(0);
    lastIdRef.current  = 0;
    isFirstLoad.current = true;
    fetchMessages();
  }, [citySlug]); // eslint-disable-line

  // Polling
  useEffect(() => {
    const interval = panelOpen ? POLL_OPEN_MS : POLL_CLOSED_MS;
    pollRef.current = setInterval(() => fetchMessages(true), interval);
    return () => clearInterval(pollRef.current);
  }, [panelOpen, fetchMessages]);

  // Clear unread when panel opens
  useEffect(() => {
    if (panelOpen) setUnread(0);
  }, [panelOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await axios.post(
        `/api/chat/?city=${citySlug}`,
        { session_id: sessionId, anon_name: anonName, message: text.trim() },
        { timeout: 5000 }
      );
      // Optimistically add own message
      setMessages(prev => {
        const exists = prev.find(m => m.id === data.id);
        return exists ? prev : [...prev, data];
      });
      lastIdRef.current = Math.max(lastIdRef.current, data.id);
      setError(null);
    } catch {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [citySlug, sessionId, anonName]);

  const toggleReaction = useCallback(async (messageId, emoji) => {
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const counts = { ...m.reaction_counts };
      const myR    = [...(m.my_reactions ?? [])];
      const idx    = myR.indexOf(emoji);
      if (idx >= 0) {
        myR.splice(idx, 1);
        counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1);
      } else {
        myR.push(emoji);
        counts[emoji] = (counts[emoji] ?? 0) + 1;
      }
      return { ...m, reaction_counts: counts, my_reactions: myR };
    }));

    try {
      await axios.post(`/api/chat/${messageId}/react/`, { session_id: sessionId, emoji });
    } catch { /* revert could be done here */ }
  }, [sessionId]);

  return { messages, online, unread, sending, error, sessionId, anonName, sendMessage, toggleReaction };
}
