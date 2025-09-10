import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "../App.css";
import "./Profile.css";
import ConfirmModal from "./ConfirmModal";
import posterFiller from "../assets/posterFiller.jpg";
import { deriveSlug } from "../utils/slug";
import streakFire from "../assets/streak.svg";

// Import icons
import heart from "../assets/heart.png";
import checklist from "../assets/checklist.png";
import eye from "../assets/eye.png";
import star from "../assets/star.png";
import calendar from "../assets/calendar.png";
import GenrePieChart from "./subcomps/GenrePieChart";
import Heatmap from "./subcomps/Heatmap";

function Profile() {
    const navigate = useNavigate();
  const { 
    user, 
    loading, 
    error, 
    userStats, 
    isLoading,
    watchedList,
    watchlist,
    likedList
  } = useUserData();

  const [userSlug, setUserSlug] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.uid) {
        try { const s = await deriveSlug(user.uid); if (active) setUserSlug(s); } catch(_) {}
      } else { setUserSlug(''); }
    })();
    return () => { active = false; };
  }, [user]);
  
  const [animatedStats, setAnimatedStats] = useState({
    watchlistCount: 0,
    watchedCount: 0,
    likedCount: 0
  });

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [user, loading, navigate]);

    useEffect(() => {
    if (userStats) {
      // Animate stats counting up
      animateStats(userStats);
    }
  }, [userStats]);

  const animateStats = (targetStats) => {
    const duration = 1000; // 1 second
    const steps = 30;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedStats({
        watchlistCount: Math.floor(targetStats.watchlistCount * progress),
        watchedCount: Math.floor(targetStats.watchedCount * progress),
        likedCount: Math.floor(targetStats.likedCount * progress)
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(targetStats);
      }
    }, stepDuration);
  };

  const handleLogout = async () => {
    try {
      setConfirmOpen(true);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getMemberSince = () => {
    if (user?.metadata?.creationTime) {
      const date = new Date(user.metadata.creationTime);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
    return 'Recently';
  };

  const getStatusMessage = () => {
    const totalMovies = userStats.watchlistCount + userStats.watchedCount + userStats.likedCount;
    if (totalMovies === 0) {
      return "Ready to discover amazing movies!";
    } else if (totalMovies < 5) {
      return "Building your movie collection";
    } else if (totalMovies < 20) {
      return "Movie enthusiast in the making";
    } else {
      return "True cinephile and movie expert";
    }
  };

  // Helpers to pick latest items
  const getTsMs = (obj, key) => {
    const t = obj && obj[key];
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Date.parse(t) || 0;
    if (typeof t === 'object') {
      if (typeof t.seconds === 'number') {
        const ns = typeof t.nanoseconds === 'number' ? t.nanoseconds : 0;
        return t.seconds * 1000 + Math.floor(ns / 1e6);
      }
      const d = new Date(t); const ms = d.getTime(); return isNaN(ms) ? 0 : ms;
    }
    return 0;
  };
  const latestBy = (arr = [], key) => {
    if (!arr || arr.length === 0) return null;
    let best = null; let bestTs = -1;
    for (const m of arr) {
      const ts = getTsMs(m, key);
      if (ts > bestTs) { best = m; bestTs = ts; }
    }
    return best;
  };

  const handleHeaderSearch = (query) => {
    const q = (query || '').trim();
    if (!q) return;
    navigate(`/?search=${encodeURIComponent(q)}`);
  };

  if (loading || isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorMessage}>Error: {error.message}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getWatchedMs = (m) => {
    const t = m && m.watchedAt;
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Date.parse(t) || 0;
    if (typeof t === 'object') {
      if (typeof t.seconds === 'number') {
        const ns = typeof t.nanoseconds === 'number' ? t.nanoseconds : 0;
        return t.seconds * 1000 + Math.floor(ns / 1e6);
      }
      const d = new Date(t); const ms = d.getTime(); return isNaN(ms) ? 0 : ms;
    }
    return 0;
  };
 
  return (
    <div style={styles.container}>
      <Header onSearch={handleHeaderSearch} />
      
      {/* Dark Gradient Header Background */}
      <div style={styles.gradientHeader}>
        <div style={styles.profileHeader}>
          <div style={styles.profileImageContainer}>
            <div style={styles.profileImage}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  style={styles.profileImg}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const initial = document.createElement('div');
                    initial.style.width = '100%';
                    initial.style.height = '100%';
                    initial.style.display = 'flex';
                    initial.style.alignItems = 'center';
                    initial.style.justifyContent = 'center';
                    initial.style.fontSize = '48px';
                    initial.style.fontWeight = 'bold';
                    initial.style.color = '#181c24';
                    initial.style.background = 'linear-gradient(135deg, #ffd93d, #ffb347)';
                    initial.textContent = (user.displayName ? user.displayName.charAt(0) : (user.email || '?').charAt(0)).toUpperCase();
                    e.currentTarget.parentNode.innerHTML = '';
                    e.currentTarget.parentNode.appendChild(initial);
                  }}
                />
              ) : (
                <div style={styles.profileInitial}>
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </h1>
            <p style={styles.profileEmail}>{user.email}</p>
            <div style={styles.statusContainer}>
              <span style={styles.statusMessage}>{getStatusMessage()}</span>
            </div>
            <div style={styles.memberBadge}>
              <img src={calendar} alt="Member since" style={styles.badgeIcon} />
              <span style={styles.memberText}>Member since {getMemberSince()}</span>
            </div>
            <button 
              className="logout-button"
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              <span style={styles.logoutText}>Sign Out</span>
            </button>
          </div>
          
        </div>
      </div>

      <div style={styles.content}>
        {/* Movie Stats - Made clickable */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>YOUR MOVIE STATS</h2>
          <div style={styles.statsGrid}>
            <div 
              className="stat-card"
              style={styles.statCard}
              onClick={() => navigate('/watchlist')}
            >
              <div style={styles.statNumber}>{animatedStats.watchlistCount}</div>
              <div style={styles.statLabel}>Movies in Watchlist</div>
              <img src={checklist} alt="Watchlist" style={styles.statIcon} />
            </div>
            
            <div 
              className="stat-card"
              style={styles.statCard}
              onClick={() => navigate('/watchlist')}
            >
              <div style={styles.statNumber}>{animatedStats.watchedCount}</div>
              <div style={styles.statLabel}>Movies Completed</div>
              <img src={eye} alt="Watched" style={styles.statIcon} />
            </div>
            
            <div 
              className="stat-card"
              style={styles.statCard}
              onClick={() => navigate('/likedlist')}
            >
              <div style={styles.statNumber}>{animatedStats.likedCount}</div>
              <div style={styles.statLabel}>Favorites Saved</div>
              <img src={heart} alt="Liked" style={styles.statIcon} />
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <GenrePieChart movies={watchedList} />
          </div>

          {/* Heatmap + Streaks */}
          <div style={{ marginTop: 24 }}>
            <Heatmap
              title="WATCH TIME"
              events={(watchedList || []).map(m => ({ date: new Date(getWatchedMs(m)), count: 1 }))}
            />
            {/* Streaks */}
            <Streaks watchedList={watchedList} />
            {/* Badges */}
            <Badges watchedList={watchedList} />
          </div>
        </section>

        {/* For You */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>FOR YOU</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
            {/* Latest Watched */}
            <ForYouTile
              title="Your last watched"
              movie={latestBy(watchedList, 'watchedAt')}
              fallbackText="No watched movies yet"
              onClick={() => userSlug && navigate(`/${userSlug}/watchlist?tab=watched`, { target: '_blank' })}
            />
            {/* Latest Liked */}
            <ForYouTile
              title="Your last liked"
              movie={latestBy(likedList, 'likedAt')}
              fallbackText="No liked movies yet"
              onClick={() => userSlug && navigate(`/${userSlug}/likedlist`, { target: '_blank' })}
            />
            {/* Watchlist Remaining */}
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:16, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', justifyContent:'center' }}>
              <div style={{ fontWeight:800, marginBottom:6 }}>Still to watch</div>
              <div style={{ color:'#b8c5d6' }}>{(watchlist || []).length} movies waiting in your watchlist</div>
              <div style={{ marginTop:8, fontSize:13, color:'#ffd93d', fontWeight:700 }}>Let’s go { (user?.displayName || user?.email || 'there').split(' ')[0].split('@')[0] }!</div>
              <button onClick={() => userSlug && navigate(`/${userSlug}/watchlist`, { target: '_blank' })} style={{ marginTop:12, padding:'10px 16px', border:'none', borderRadius:12, fontWeight:700, background:'linear-gradient(45deg,#ffd93d,#ffb347)', color:'#181c24', cursor:'pointer' }}>Open Watchlist</button>
            </div>
          </div>
        </section>

        {/* Account Settings - Grouped at bottom */}
        {/* <section style={styles.section}>
          <h2 style={styles.sectionTitle}>ACCOUNT SETTINGS</h2>
          <div style={styles.settingsGrid}>
            <button 
              className="setting-button"
              style={styles.settingButton}
            >
              <img src={star} alt="Edit" style={styles.settingIcon} />
              <span style={styles.settingText}>Edit Profile</span>
            </button>
            
            <button 
              className="setting-button"
              style={styles.settingButton}
            >
              <img src={eye} alt="Privacy" style={styles.settingIcon} />
              <span style={styles.settingText}>Privacy Settings</span>
            </button>
            
            
          </div>
        </section> */}
      </div>
      
      <Footer />
      <ConfirmModal
        open={confirmOpen}
        title="Sign out?"
        description="You'll be returned to the login screen."
        confirmText="Sign out"
        cancelText="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          try {
            const { auth } = await import("../firebaseConfig");
            await auth.signOut();
            navigate("/login");
          } catch (e) {}
        }}
      />
    </div>
  );
}

function Streaks({ watchedList = [] }){
  const days = new Set((watchedList || []).map(m => new Date(getSafeTime(m)).toISOString().slice(0,10)));
  const today = new Date();
  const dayKey = (d) => d.toISOString().slice(0,10);
  let cur = 0, best = 0;
  // compute best over last 365 days
  let run = 0;
  for (let i = 0; i < 365; i++){
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dayKey(d);
    if (days.has(key)) { run++; best = Math.max(best, run); }
    else run = 0;
  }
  // compute current streak
  run = 0;
  for (let i = 0; i < 365; i++){
    const d = new Date(); d.setDate(d.getDate() - i);
    if (days.has(dayKey(d))) run++; else break;
  }
  cur = run;
  return (
    <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
        Streak:
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {Array.from({ length: Math.min(cur, 14) }).map((_,i)=>(
          <img key={i} src={streakFire} alt="🔥" style={{ width:16, height:16, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        ))}
      </div>
      <div style={{ color:'#b8c5d6' }}>Current: {cur} - Best streak: {best}</div>
    </div>
  );
  function getSafeTime(m){
    const t = m && m.watchedAt;
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Date.parse(t) || 0;
    if (typeof t === 'object') {
      if (typeof t.seconds === 'number') {
        const ns = typeof t.nanoseconds === 'number' ? t.nanoseconds : 0;
        return t.seconds * 1000 + Math.floor(ns / 1e6);
      }
      const d = new Date(t); const ms = d.getTime(); return isNaN(ms) ? 0 : ms;
    }
    return 0;
  }
}

function Badges({ watchedList = [] }){
  const total = watchedList.length || 0;
  const days = new Set((watchedList || []).map(m => new Date(getSafeTime(m)).toISOString().slice(0,10)));
  // simple achievements
  const badges = [];
  if (total >= 1) badges.push({ key:'first', label:'First Watch' });
  if (streak(watchedList) >= 7) badges.push({ key:'streak7', label:'7‑Day Streak' });
  if (streak(watchedList) >= 30) badges.push({ key:'streak30', label:'30‑Day Streak' });
  const genreSet = new Set();
  (watchedList || []).forEach(m => (m.genre_ids || []).forEach(id => genreSet.add(id)));
  if (genreSet.size >= 10) badges.push({ key:'explorer', label:'Genre Explorer' });
  // weekend warrior (>=3 movies on a weekend day in last 60 days)
  const weekendHeavy = (() => {
    const map = new Map();
    for (const m of watchedList){
      const d = new Date(getSafeTime(m));
      const diff = (Date.now() - d.getTime()) / (1000*60*60*24);
      if (diff > 60) continue;
      const day = d.getDay();
      if (day === 0 || day === 6){
        const key = d.toISOString().slice(0,10); map.set(key, (map.get(key)||0)+1);
      }
    }
    for (const v of map.values()) if (v >= 3) return true; return false;
  })();
  if (weekendHeavy) badges.push({ key:'weekend', label:'Weekend Warrior' });

  const descByKey = {
    first: 'Watched your first movie on Watchsy',
    streak7: 'Watched on 7 consecutive days',
    streak30: 'Watched on 30 consecutive days',
    explorer: 'Watched 10 or more different genres',
    weekend: 'Watched 3+ movies on a single weekend day (last 60 days)'
  };
  const [hovered, setHovered] = React.useState(null);
 
  return (
    <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
      <div style={{ fontWeight:700 }}>Badges:</div>
      {badges.map(b => (
        <div
          key={b.key}
          onMouseEnter={() => setHovered(b.key)}
          onMouseLeave={() => setHovered(null)}
          style={{ position:'relative', padding:'6px 10px', borderRadius:16, background:'linear-gradient(90deg, #d53369 0%, #daae51 100%)', border:'1px solid rgba(255,255,255,0.12)', fontSize:12, fontWeight:700 }}
        >
          {b.label}
          {hovered === b.key && (
            <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, background:'rgba(15,19,32,0.95)', color:'#e6edf6', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'8px 10px', fontSize:12, whiteSpace:'nowrap', boxShadow:'0 8px 20px rgba(0,0,0,0.4)', zIndex:5 }}>
              {descByKey[b.key] || 'Badge earned'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
  function streak(list){
    const set = new Set(list.map(m => new Date(getSafeTime(m)).toISOString().slice(0,10)));
    let run = 0, best = 0;
    for (let i=0;i<365;i++){
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().slice(0,10);
      if (set.has(key)) { run++; best = Math.max(best, run); }
      else run = 0;
    }
    return best;
  }
  function getSafeTime(m){
    const t = m && m.watchedAt;
    if (!t) return 0;
    if (typeof t === 'number') return t;
    if (typeof t === 'string') return Date.parse(t) || 0;
    if (typeof t === 'object') {
      if (typeof t.seconds === 'number') {
        const ns = typeof t.nanoseconds === 'number' ? t.nanoseconds : 0;
        return t.seconds * 1000 + Math.floor(ns / 1e6);
      }
      const d = new Date(t); const ms = d.getTime(); return isNaN(ms) ? 0 : ms;
    }
    return 0;
  }
}

function ForYouTile({ title, movie, fallbackText, onClick }){
  return (
    <div onClick={onClick} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:16, cursor: movie ? 'pointer' : 'default', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', justifyContent:'center' }}>
      <div style={{ width:140, height:210, borderRadius:10, overflow:'hidden', background:'#0f1320', border:'1px solid rgba(255,255,255,0.08)' }}>
        {movie ? (
          <img src={movie.poster || posterFiller} alt={movie.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e)=>{ e.currentTarget.src = posterFiller; }} />
        ) : (
          <div style={{ width:'100%', height:'100%' }} />
        )}
      </div>
      <div style={{ fontWeight:800, marginTop:10 }}>{title}</div>
      <div style={{ color:'#e6edf6', marginTop:4 }}>{movie ? movie.title : fallbackText}</div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #181c24 0%, #232b3b 100%)',
    color: '#f5f6fa',
    fontFamily: 'Product Sans, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #181c24 0%, #232b3b 100%)',
    color: '#f5f6fa'
  },
  
  spinner: {
    fontSize: '18px',
    color: '#ffd93d'
  },
  
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #181c24 0%, #232b3b 100%)',
    color: '#f5f6fa'
  },
  
  errorMessage: {
    fontSize: '18px',
    color: '#ff6b6b',
    textAlign: 'center'
  },

  // Dark Gradient Header
  gradientHeader: {
    background: 'linear-gradient(135deg, #181c24 0%, #232b3b 50%, #333a4d 100%)',
    padding: '40px 0 20px 0',
    position: 'relative',
    overflow: 'hidden'
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    marginLeft: '150px',
    padding: "2rem",
    borderRadius: "20px",
    transition: "all 0.3s ease-in-out",
  },

  profileImageContainer: {
    flexShrink: 0
  },

  profileImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid #ffd93d',
    boxShadow: '0 8px 32px rgba(255, 217, 61, 0.3)',
    backdropFilter: 'blur(10px)',
    background: 'rgba(255, 255, 255, 0.05)'
  },

  profileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  profileInitial: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#181c24',
    background: 'linear-gradient(135deg, #ffd93d, #ffb347)'
  },

  profileInfo: {
    flex: 1,
    color: '#f5f6fa'
  },

  profileName: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #f5f6fa 0%, #ffd93d 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },

  profileEmail: {
    fontSize: '18px',
    margin: '0 0 16px 0',
    color: '#b8c5d6'
  },

  statusContainer: {
    marginBottom: '16px'
  },

  statusMessage: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: '#8b9bb4',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 16px',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },

  memberBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 217, 61, 0.1)',
    padding: '8px 16px',
    borderRadius: '25px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 217, 61, 0.2)',
    width: 'fit-content'
  },

  badgeIcon: {
    width: '16px',
    height: '16px',
    filter: 'brightness(0) saturate(100%) invert(85%) sepia(100%) saturate(1000%) hue-rotate(45deg) brightness(1.2)'
  },

  memberText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffd93d'
  },

  content: {
    maxWidth: '1200px',
    margin: '-30px auto 0 auto',
    padding: '0 20px 40px 20px',
    position: 'relative',
    zIndex: 2,
    marginTop: '30px'
  },

  section: {
    marginBottom: '40px'
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#f5f6fa',
    marginBottom: '24px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    textAlign: 'center',
    position: 'relative'
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '20px'
  },

  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '32px 24px',
    borderRadius: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  },

  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffd93d',
    marginBottom: '8px'
  },

  statLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#b8c5d6',
    marginBottom: '16px'
  },

  statIcon: {
    width: '28px',
    height: '28px',
    opacity: 0.7
  },

  // Settings Grid
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    maxWidth: '600px',
    margin: '0 auto'
  },

  settingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: '500',
    color: '#f5f6fa'
  },

  settingIcon: {
    width: '20px',
    height: '20px',
    opacity: 0.7
  },

  settingText: {
    fontSize: '14px',
    fontWeight: '500'
  },

  logoutButton: {
    marginTop: "1.5rem",
    marginLeft: '65px',
    padding: "0.8rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ff4b5c, #c9184a)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
    transition: "all 0.3s ease-in-out",
  },
  logoutText: {
    pointerEvents: "none",
  },
};

export default Profile;
