import React, { useEffect, useRef, useState } from 'react';
import ai from '../../assets/AI_logo.png';
import './AI.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebaseConfig';

export default function AI() {
  const [user] = useAuthState(auth);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const panelRef = useRef(null);
  const endRef = useRef(null);

  const placeholders = [
    'Try: Where can I watch Inception?',
    'Try: Trending movies this week',
    'Try: Top sci-fi TV shows',
  ];

  useEffect(() => {
    const saved = localStorage.getItem('watchsy_ai_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch (e) {}
    } else {
      const name = user?.displayName ? user.displayName.split(' ')[0] : 'there';
      setMessages([
        { role: 'assistant', text: `👋 Hi ${name}! Ask me about movies, shows, or where to watch.` },
        { role: 'assistant', text: 'Examples: "Trending Movies", "Top Actors", "Where to watch Oppenheimer?"' },
      ]);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('watchsy_ai_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!input) setPlaceholderIdx((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(id);
  }, [input]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "I'm getting smarter. Full AI chat is coming soon!" },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const quickChips = [
    'Trending Movies',
    'Top Actors',
    'Where to watch Inception?',
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Watchsy AI"
        title="Watchsy AI"
        className="ai-trigger"
      >
        <img src={ai} alt="AI" />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="Watchsy AI chat"
        >
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <img src={ai} alt="AI" style={styles.avatar} />
              <div style={styles.title}>Watchsy AI</div>
              <span className="ai-badge">Powered by AI</span>
            </div>
            <div style={styles.headerRight}>
              <button type="button" aria-label="Close AI" onClick={() => setOpen(false)} style={styles.closeBtn}>×</button>
            </div>
          </div>

          <div style={styles.body}>
            <div style={styles.messages} className="ai-scroll">
              {messages.map((m, i) => (
                <div key={i} style={m.role === 'assistant' ? styles.msgAssistant : styles.msgUser}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div style={styles.msgAssistant}>
                  <span className="typing">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="ai-chips">
              {quickChips.map((q) => (
                <button key={q} type="button" className="ai-chip" onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={styles.inputRow}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders[placeholderIdx]}
                style={styles.input}
              />
              <button type="submit" style={styles.sendBtn}>Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '40vw',
    maxWidth: '560px',
    minWidth: '320px',
    height: '100vh',
    background: 'linear-gradient(180deg, #0f1320 0%, #181c24 100%)',
    color: '#eaeaea',
    zIndex: 11000,
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.5)',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(90deg, #ff0088 0%, #00b3ff 100%)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  avatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
  },
  title: {
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    lineHeight: 1,
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '12px',
    gap: '8px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px',
  },
  msgAssistant: {
    alignSelf: 'flex-start',
    background: 'linear-gradient(135deg, rgba(255,0,136,0.18) 0%, rgba(0,179,255,0.18) 100%)',
    border: '1px solid rgba(255,0,136,0.35)',
    color: '#f1f1f1',
    padding: '8px 10px',
    borderRadius: '12px',
    maxWidth: '85%',
  },
  msgUser: {
    alignSelf: 'flex-end',
    background: '#0f1320',
    border: '1px solid rgba(255,217,61,0.35)',
    color: '#f1f1f1',
    padding: '8px 10px',
    borderRadius: '12px',
    maxWidth: '85%',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    background: '#0f1320',
    color: '#fff',
    border: '1px solid rgba(255,217,61,0.35)',
    borderRadius: '10px',
    padding: '10px 12px',
    outline: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.25) inset, 0 0 0 2px rgba(255,217,61,0.08)',
  },
  sendBtn: {
    background: 'linear-gradient(90deg, #ff0088 0%, #00b3ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};