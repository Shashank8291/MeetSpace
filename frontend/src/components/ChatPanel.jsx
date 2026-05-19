import { useState, useEffect, useRef } from 'react';
import { nameToHue, relativeTime } from '../utils/nameGen';
import { useChat } from '../hooks/useChat';
import './ChatPanel.css';

const EMOJIS = ['☕', '🚀', '👍', '🔥'];

/* ─── Avatar badge ──────────────────────────────────────────── */
function Avatar({ name, size = 32 }) {
  const hue = nameToHue(name);
  const initials = name.replace(/#\d+$/, '').slice(0, 2).toUpperCase();
  return (
    <div
      className="chat-avatar"
      style={{
        width: size, height: size,
        background: `hsl(${hue},70%,25%)`,
        border: `2px solid hsl(${hue},70%,45%)`,
        color: `hsl(${hue},80%,80%)`,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Single message bubble ─────────────────────────────────── */
function MessageBubble({ msg, onReact, anonName }) {
  const [showReact, setShowReact] = useState(false);
  const hue = nameToHue(msg.anon_name);

  return (
    <div className={`msg-row ${msg.is_mine ? 'mine' : 'theirs'}`}>
      {!msg.is_mine && <Avatar name={msg.anon_name} />}

      <div className="msg-body">
        {!msg.is_mine && (
          <span className="msg-name" style={{ color: `hsl(${hue},80%,70%)` }}>
            {msg.anon_name}
          </span>
        )}

        <div
          className="msg-bubble"
          onMouseEnter={() => setShowReact(true)}
          onMouseLeave={() => setShowReact(false)}
        >
          <p className="msg-text">{msg.message}</p>

          {/* Reaction picker (appears on hover) */}
          {showReact && (
            <div className="react-picker">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className={`react-pick-btn ${msg.my_reactions?.includes(e) ? 'active' : ''}`}
                  onClick={() => onReact(msg.id, e)}
                  title={e}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction counts bar */}
        {msg.reaction_counts && Object.keys(msg.reaction_counts).length > 0 && (
          <div className="msg-reactions">
            {EMOJIS.filter(e => msg.reaction_counts[e] > 0).map(e => (
              <button
                key={e}
                className={`reaction-pill ${msg.my_reactions?.includes(e) ? 'reacted' : ''}`}
                onClick={() => onReact(msg.id, e)}
              >
                {e} <span>{msg.reaction_counts[e]}</span>
              </button>
            ))}
          </div>
        )}

        <span className="msg-time">{msg.time_display}</span>
      </div>

      {msg.is_mine && <Avatar name={anonName} />}
    </div>
  );
}

/* ─── Typing indicator ──────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="typing-indicator">
      <span /><span /><span />
      <p>someone is typing…</p>
    </div>
  );
}

/* ─── Main ChatPanel ────────────────────────────────────────── */
export default function ChatPanel({ citySlug, cityName, open, onClose }) {
  const { messages, online, sending, error, anonName, sendMessage, toggleReaction } =
    useChat(citySlug, open);

  const [text, setText]       = useState('');
  const [typing, setTyping]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const typingTimer = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Show typing indicator briefly after last message received
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.is_mine) return;
    const age = Date.now() - new Date(last.created_at);
    if (age < 8000) {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 4000);
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const t = text;
    setText('');
    await sendMessage(t);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && <div className="chat-backdrop" onClick={onClose} />}

      <aside className={`chat-panel glass ${open ? 'open' : ''}`} aria-label="Community Chat">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-header-icon">💬</div>
            <div>
              <h2 className="chat-title">{cityName} Dev Chat</h2>
              <p className="chat-online">
                <span className="online-dot" />
                {online} online now
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">✕</button>
        </div>

        {/* Identity badge */}
        <div className="chat-identity">
          <Avatar name={anonName} size={24} />
          <span>You are <strong>{anonName}</strong></span>
        </div>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages-scroll">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>🌐 No messages yet in {cityName}.</p>
              <p>Be the first to say hi!</p>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              anonName={anonName}
              onReact={toggleReaction}
            />
          ))}

          {typing && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Error bar */}
        {error && <div className="chat-error">{error}</div>}

        {/* Input */}
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-input"
            placeholder="Say something to the community…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            maxLength={500}
            disabled={sending}
          />
          <button
            id="chat-send-btn"
            className="chat-send-btn btn btn-primary"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? '…' : '➤'}
          </button>
        </div>
        <p className="chat-hint">Enter to send · {500 - text.length} chars left</p>
      </aside>
    </>
  );
}
