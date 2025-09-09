import React, { useEffect, useRef, useState } from 'react';
import ai from '../../assets/AI_logo.png';
import './AI.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { askOpenAI } from '../../api/OpenAi';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit as fsLimit } from 'firebase/firestore';
import { searchMovies } from '../../api/tmdb';
import { useUserData } from '../../hooks/useUserData';
import { useToast } from '../ToastProvider';

export default function AI() {
  const [user] = useAuthState(auth);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const panelRef = useRef(null);
  const messagesRef = useRef(null);
  const endRef = useRef(null);
  const { addMovieToWatchlist } = useUserData();
  const toast = useToast();

  const placeholders = [
    'Try: Where can I watch Inception?',
    'Try: Trending movies this week',
    'Try: Top sci-fi TV shows',
  ];

  // Keyword-based on-topic filter (movies/TV only)
  const MOVIE_KEYWORDS = [
    'movie','movies','film','films','cinema','theater','theatre','trailer','imdb','tmdb','rotten tomatoes','letterboxd','box office','runtime','rating','genre','cast','actor','actress','director','crew','screenplay','episode','season','tv','tv show','series','miniseries','anime','cartoon','where to watch','stream','streaming','netflix','hbo','hbo max','max','disney','disney+','prime','prime video','hulu','paramount','paramount+','peacock','apple tv','apple tv+','watchlist','liked','recommend','recommendation','soundtrack','score'
  ];
  const isOnTopic = (text) => {
    const t = String(text || '').toLowerCase();
    const wordCount = t.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount <= 3) return true; // allow likely titles/short queries
    return MOVIE_KEYWORDS.some(k => t.includes(k));
  };

  // Lock page scroll while chat is open
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.dataset.prevOverflow = prevOverflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = document.body.dataset.prevOverflow || '';
      };
    }
  }, [open]);

  // Firestore: subscribe to chat history only when panel is open; limit to recent messages
  useEffect(() => {
    if (!user?.uid || !open) return;
    const col = collection(db, 'users', user.uid, 'aiMessages');
    const q = query(col, orderBy('createdAt', 'desc'), fsLimit(200));
    const unsub = onSnapshot(q, (snap) => {
      const cloud = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const normalized = cloud.map(m => ({ role: m.role || 'assistant', text: m.text || '' })).reverse();
      if (normalized.length > 0) setMessages(normalized);
    });
    return () => unsub();
  }, [user, open]);

  useEffect(() => {
    const saved = localStorage.getItem('watchsy_ai_messages');
    if (saved && messages.length === 0) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch (e) {}
    } else if (!saved && messages.length === 0) {
      const name = user?.displayName ? user.displayName.split(' ')[0] : 'there';
      setMessages([
        { role: 'assistant', text: `👋 Hi ${name}! Ask me about movies, shows, or where to watch.` },
        { role: 'assistant', text: 'Examples: "Trending Movies", "Top Actors", "Where to watch Oppenheimer?"' },
      ]);
    }
  }, [user, messages.length]);

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

  // Keep chat scrolled to bottom without affecting page scroll
  const scrollToBottom = () => {
    if (messagesRef.current) {
      // Use rAF to ensure layout is up to date before scrolling
      requestAnimationFrame(() => {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, open]);

  const persistMessage = async (role, text) => {
    try {
      if (!user?.uid) return;
      const col = collection(db, 'users', user.uid, 'aiMessages');
      await addDoc(col, { role, text, createdAt: serverTimestamp() });
    } catch (_) {}
  };

  const sendMessage = async (evtOrText) => {
    if (isTyping) return;
    if (evtOrText && typeof evtOrText.preventDefault === 'function') {
      evtOrText.preventDefault();
      evtOrText.stopPropagation?.();
    }
    const base = typeof evtOrText === 'string' ? evtOrText : input;
    const text = String(base || '').trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    persistMessage('user', text);

    // Guardrail: refuse off-topic queries locally without calling API
    if (!isOnTopic(text)) {
      const refusal = "I can help with movies and TV only — recommendations, where to watch, cast/crew, ratings, trailers, and genres. Ask me something in that space.";
      setMessages((prev) => [...prev, { role: 'assistant', text: refusal }]);
      persistMessage('assistant', refusal);
      setInput('');
      scrollToBottom();
      return;
    }

    setInput('');
    setIsTyping(true);

    try {
      const reply = await askOpenAI(text, {
        temperature: 0.4,
        system: 'You are Watchsy AI. ONLY answer topics about movies, TV shows, streaming, cast/crew, ratings, trailers, recommendations, platforms and genres. If the user asks anything else, briefly refuse and steer them back to film/TV. Keep answers concise and scannable with lists when helpful.',
      });

      const out = reply || 'I had trouble generating a reply. Try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: out },
      ]);
      persistMessage('assistant', out);
    } catch (error) {
      const errMsg = (error && (error.message || String(error))) || 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Sorry, I couldn't process that request. ${errMsg}` },
      ]);
      persistMessage('assistant', `Sorry, I couldn't process that request. ${errMsg}`);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const onInputKeyDown = (e) => {
    // Prevent the outer header form from submitting
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const quickChips = [
    'Trending Movies',
    'Top Actors',
    'Where to watch Inception?',
  ];

  // Lightweight formatter: convert inline numbered items to lines, render lists
  const renderMessage = (text) => {
    const raw = String(text || '');

    const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const toInlineHtml = (s) => {
      let html = escapeHtml(s);
      // Code blocks ```code```
      html = html.replace(/```([\s\S]*?)```/g, (m, code) => `<pre class="ai-code"><code>${code}</code></pre>`);
      // Bold, italic, inline code
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
      // Markdown links and raw links
      html = html.replace(/\[([^\]]+)\]\((https?:\/\/[\S]+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      html = html.replace(/(https?:\/\/[\S]+?)(?=\s|$)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      return html;
    };

    // Insert newlines before occurrences like "1. ", "2. ", etc. if everything is in one paragraph
    let normalized = raw.includes('\n') ? raw : raw.replace(/(\d+\.\s)/g, '\n$1');
    // Split into non-empty trimmed lines
    const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const isOrdered = lines.length > 1 && lines.every(l => /^\d+\.\s/.test(l));
    const isUnordered = lines.length > 1 && lines.every(l => /^[-*•]\s/.test(l));
    if (isOrdered) {
      return (
        <ol className="ai-list">
          {lines.map((l, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: toInlineHtml(l.replace(/^\d+\.\s*/, '')) }} />
          ))}
        </ol>
      );
    }
    if (isUnordered) {
      return (
        <ul className="ai-list">
          {lines.map((l, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: toInlineHtml(l.replace(/^[-*•]\s*/, '')) }} />
          ))}
        </ul>
      );
    }
    // Paragraph fallback preserving line breaks
    const paras = normalized.split(/\n{2,}/).filter(Boolean);
    return paras.map((p, i) => (
      <p key={i} className="ai-p" style={{ margin: '0 0 6px 0', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: toInlineHtml(p) }} />
    ));
  };

  // Helpers to parse titles and pick best TMDB match
  const normalizeTitle = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const chooseBestResult = (results, target) => {
    const nt = normalizeTitle(target);
    let best = null; let bestScore = -1;
    for (const r of (results || [])) {
      const rt = normalizeTitle(r.title || r.name || '');
      let score = 0;
      if (rt === nt) score += 100;
      else if (rt.startsWith(nt) || nt.startsWith(rt)) score += 60;
      score += (r.popularity || 0) * 0.01 + (r.vote_count || 0) * 0.001 + (r.vote_average || 0);
      if (r.poster_path) score += 5;
      if (score > bestScore) { bestScore = score; best = r; }
    }
    return best;
  };
  const parseAiTitles = (text) => {
    const numbered = /^\d+[\.)]?\s+/;
    const bulleted = /^[-*•]\s+/;
    return String(text || '')
      .split(/\r?\n+/)
      .map(l => l.trim())
      .filter(l => numbered.test(l) || bulleted.test(l))
      .map(l => l.replace(/^[-*•\d]+[\.)\s]+/, '').replace(/\s*\(\d{4}\).*/, '').trim())
      .filter(Boolean)
      .slice(0, 20);
  };

  const isNumberedList = (text) => {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const count = lines.filter(l => /^\d+[\.)]?\s+/.test(l)).length;
    return count >= 3; // show button when there are at least 3 numbered items
  };

  const addAllFromAssistantText = async (text) => {
    try {
      if (!user) { toast.info && toast.info('Please login'); return; }
      const titles = parseAiTitles(text);
      if (titles.length === 0) return;
      let added = 0;
      for (const title of titles) {
        try {
          const results = await searchMovies(title);
          const best = chooseBestResult(results, title);
          if (!best) continue;
          const movie = {
            id: best.id,
            title: best.title || best.name,
            poster: best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : '',
            rating: best.vote_average,
            year: best.release_date ? best.release_date.split('-')[0] : undefined,
          };
          const res = await addMovieToWatchlist(movie);
          if (res?.success) added += 1;
        } catch (_) {}
      }
      if (added > 0) {
        if (toast && typeof toast.success === 'function') toast.success(`Added ${added} to Watch Later`);
      } else {
        if (toast && typeof toast.info === 'function') toast.info('No movies could be added');
      }
    } catch (e) {
      if (toast && typeof toast.error === 'function') toast.error('Failed to add movies');
    }
  };

  const stopScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
        <>
          <div
            style={styles.overlay}
            onClick={() => setOpen(false)}
            onWheel={stopScroll}
            onTouchMove={stopScroll}
          />
          <div
            ref={panelRef}
            style={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Watchsy AI chat"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
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
              <div style={styles.messages} className="ai-scroll" ref={messagesRef}>
                {messages.map((m, i) => {
                  const isAssistant = m.role === 'assistant';
                  const showAdd = isAssistant && isNumberedList(m.text);
                  const bubbleStyle = isAssistant
                    ? { ...styles.msgAssistant, paddingBottom: showAdd ? 48 : 8 }
                    : styles.msgUser;
                  return (
                    <div key={i} style={bubbleStyle}>
                      <div style={styles.msgText} className="ai-msg">{renderMessage(m.text)}</div>
                      {showAdd && (
                      <button
                        type="button"
                        onClick={() => addAllFromAssistantText(m.text)}
                        style={styles.addAllBtn}
                        title="Add all to Watch Later"
                      >
                        ➕ Add to Watch List
                      </button>
                      )}
                    </div>
                  );
                })}
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

              {/* Input row (no form) */}
              <div style={styles.inputRow} onKeyDown={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={placeholders[placeholderIdx]}
                  style={styles.input}
                />
                <button type="button" style={styles.sendBtn} onClick={sendMessage} disabled={isTyping} aria-busy={isTyping}>
                  {isTyping ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
    </div>
        </>
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 10990,
  },
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
    minHeight: 0,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingRight: '4px',
    minHeight: 0,
  },
  msgAssistant: {
    alignSelf: 'flex-start',
    background: 'linear-gradient(135deg, rgba(255,0,136,0.18) 0%, rgba(0,179,255,0.18) 100%)',
    border: '1px solid rgba(255,0,136,0.35)',
    color: '#f1f1f1',
    padding: '8px 10px',
    borderRadius: '12px',
    maxWidth: '85%',
    position: 'relative',
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
  msgText: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    whiteSpace: 'normal',
  },
  addAllBtn: {
    position: 'absolute',
    right: '10px',
    bottom: '10px',
    background: 'linear-gradient(90deg, #1CB5E0 40%, #ffffff 100%)',
    color: '#181c24',
    border: 'none',
    borderRadius: '16px',
    padding: '6px 10px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
};