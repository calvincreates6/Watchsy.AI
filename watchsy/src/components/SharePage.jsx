import React, { useEffect, useMemo, useState } from 'react';
import Header from './subcomps/Header';
import Footer from './subcomps/Footer';
import { useUserData } from '../hooks/useUserData';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { deriveListSlug } from '../utils/slug';
import { setPrivacySettings, upsertPublicLink } from '../services/database';
import checklist from '../assets/checklist.png';
import heart from '../assets/heart.png';
import eye from '../assets/eye.png';
import posterFiller from '../assets/posterFiller.jpg';
import './SharePage.css';

export default function SharePage() {
  const {
    watchlist = [],
    likedList = [],
    watchedList = [],
  } = useUserData();
  const [authUser] = useAuthState(auth);
  const [slugs, setSlugs] = useState({ watched: '', liked: '', watchlist: '' });
  const [privacy, setPrivacy] = useState({ watchlist: 'private', liked: 'private', watched: 'private' });
  const [openMenu, setOpenMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (authUser?.uid) {
        const [sw, sl, swl] = await Promise.all([
          deriveListSlug(authUser.uid, 'watched'),
          deriveListSlug(authUser.uid, 'liked'),
          deriveListSlug(authUser.uid, 'watchlist'),
        ]);
        setSlugs({ watched: sw, liked: sl, watchlist: swl });
        // Load persisted privacy and apply
        try {
          const { getPrivacySettings } = await import('../services/database');
          const res = await getPrivacySettings({ uid: authUser.uid, email: authUser.email });
          if (res?.data) setPrivacy(prev => ({ ...prev, ...res.data }));
        } catch(_){}
      }
    })();
  }, [authUser]);

  const base = useMemo(() => window.location.origin, []);

  const links = useMemo(() => ({
    watched: `${base}/s/watchlist/${slugs.watched}?tab=watched`,
    watchlist: `${base}/s/watchlist/${slugs.watchlist}`,
    liked: `${base}/s/likedlist/${slugs.liked}`,
  }), [base, slugs]);

  const getWatchedTime = (movie) => {
    const t = movie && movie.watchedAt;
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Date.parse(t) || 0;
    if (typeof t === 'object') {
      if (typeof t.seconds === 'number') {
        const ns = typeof t.nanoseconds === 'number' ? t.nanoseconds : 0;
        return t.seconds * 1000 + Math.floor(ns / 1e6);
      }
      const d = new Date(t);
      const ms = d.getTime();
      return isNaN(ms) ? 0 : ms;
    }
    return 0;
  };

  const watchedSorted = useMemo(() => (watchedList || []).slice().sort((a, b) => getWatchedTime(b) - getWatchedTime(a)), [watchedList]);

  const previews = useMemo(() => ({
    watched: watchedSorted.slice(0, 4),
    liked: (likedList || []).slice(0, 4),
    watchlist: (watchlist || []).slice(0, 4),
  }), [watchedSorted, likedList, watchlist]);

  const rows = [
    { key: 'watched', label: 'Watched', icon: eye },
    { key: 'liked', label: 'Liked', icon: heart },
    { key: 'watchlist', label: 'Watchlist', icon: checklist },
  ];

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1500);
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(links[key]);
      showToast('Link copied! Share it with friends 🎬');
    } catch (e) {}
  };

  const handlePrivacy = async (key, mode) => {
    const next = { ...privacy, [key]: mode };
    setPrivacy(next);
    setOpenMenu(null);
    if (authUser?.uid) {
      await setPrivacySettings({ uid: authUser.uid, email: authUser.email }, next);
      // If made link/public, ensure mapping exists
      if (mode !== 'private') {
        let slug = slugs[key];
        if (!slug) {
          try { slug = await deriveListSlug(authUser.uid, key); } catch(_) {}
        }
        if (slug) await upsertPublicLink(slug, authUser.uid, key);
      }
    }
  };

  // Ensure mappings exist on mount when slugs resolve
  useEffect(() => {
    (async () => {
      if (!authUser?.uid) return;
      for (const key of ['watched','liked','watchlist']) {
        if (slugs[key] && privacy[key] !== 'private') {
          await upsertPublicLink(slugs[key], authUser.uid, key);
        }
      }
    })();
  }, [authUser, slugs, privacy]);

  const ShareButtons = ({ link, title }) => (
    <div className="share-shareRow">
      <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + link)}`} target="_blank" rel="noopener noreferrer" className="share-shareBtn btn-light">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-whatsapp" viewBox="0 0 16 16">
  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
    
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="share-shareBtn btn-dark">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-twitter-x" viewBox="0 0 16 16">
  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
</svg>
      </a>
      <a href={`https://www.reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="share-shareBtn btn-dark">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-reddit" viewBox="0 0 16 16">
  <path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z"/>
  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165"/>
</svg>
      </a>
      <a href={`https://www.instagram.com/?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="share-shareBtn btn-light ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
</svg>
      </a>
    </div>
  );

  return (
    <div className="share-container">
      <Header onSearch={() => {}} />
      <div className="share-content">
        <h1 className="content-title" style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>Share with Friends</h1>

        <div className="share-grid">
          {rows.map((row) => (
            <div key={row.key} className="share-card">
              <div className="share-cardTop">
                <div className="share-titleRow">
                  <img src={row.icon} alt="" className="share-titleIcon" />
                  <span style={{ color: '#eaeaea', fontWeight: 700 }}>{row.label}</span>
                  <span className={`share-privacyPill ${privacy[row.key] === 'public' ? 'is-public' : privacy[row.key] === 'link' ? 'is-link' : 'is-private'}`}>{privacy[row.key]}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setOpenMenu(openMenu === row.key ? null : row.key)} className="share-kebabBtn" aria-haspopup="true" aria-expanded={openMenu === row.key}>⋮</button>
                  {openMenu === row.key && (
                    <div className="share-menu" role="menu">
                      {['private', 'link', 'public'].map((mode) => (
                        <button key={mode} className="share-menuItem" onClick={() => handlePrivacy(row.key, mode)} role="menuitem">
                          <span style={{ marginRight: 8 }}>{mode === 'private' ? '🔒' : mode === 'public' ? '🌐' : '🔗'}</span>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          {privacy[row.key] === mode ? <span style={{ marginLeft: 8 }}>•</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="share-previewRow">
                {previews[row.key].map((m, i) => (
                  <img key={m.id || i} src={m.poster || posterFiller} alt={m.title || 'Poster'} className="share-poster" onError={(e) => { e.currentTarget.src = posterFiller; }} />
                ))}
                {previews[row.key].length === 0 && (
                  <div className="share-noPreview">No items yet</div>
                )}
              </div>

              <div className="share-linkRow">
                <input readOnly value={links[row.key]} onFocus={(e) => e.currentTarget.select()} className="share-linkInput" />
                <button type="button" onClick={() => handleCopy(row.key)} className="share-copyBtn">Copy</button>
                <div className="share-qrWrap">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(links[row.key])}`} alt="QR" className="share-qr" />
                </div>
              </div>

              <ShareButtons link={links[row.key]} title={`Check out my ${row.label} on Watchsy`} />
            </div>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="share-toast">{toastMsg}</div>
      )}

      <Footer />
    </div>
  );
} 