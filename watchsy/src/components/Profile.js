import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "../App.css";
import "./Profile.css";
import ConfirmModal from "./ConfirmModal";

// Import icons
import home from "../assets/home.png";
import heart from "../assets/heart.png";
import checklist from "../assets/checklist.png";
import eye from "../assets/eye.png";
import star from "../assets/star.png";
import calendar from "../assets/calendar.png";
import GenrePieChart from "./subcomps/GenrePieChart";

function Profile() {
    const navigate = useNavigate();
  const { 
    user, 
    loading, 
    error, 
    userStats, 
    isLoading,
    watchedList
  } = useUserData();
  
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
        </section>

        {/* Quick Actions - Moved to top */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>QUICK ACTIONS</h2>
          <div style={styles.quickActions}>
            <button 
              className="action-button"
              style={styles.actionButton}
              onClick={() => navigate('/')}
            >
              <img src={home} alt="Discover" style={styles.actionIcon} />
              <span style={styles.actionText}>Discover Movies</span>
            </button>
            
            <button 
              className="action-button"
              style={styles.actionButton}
              onClick={() => navigate('/watchlist')}
            >
              <img src={checklist} alt="Watchlist" style={styles.actionIcon} />
              <span style={styles.actionText}>View Watchlist</span>
            </button>
            
            <button 
              className="action-button"
              style={styles.actionButton}
              onClick={() => navigate('/likedlist')}
            >
              <img src={heart} alt="Liked" style={styles.actionIcon} />
              <span style={styles.actionText}>Liked Movies</span>
            </button>
          </div>
        </section>

        {/* Account Settings - Grouped at bottom */}
        <section style={styles.section}>
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
            
            <button 
              className="logout-button"
              style={styles.logoutButton}
              onClick={handleLogout}
            >
              <span style={styles.logoutText}>Sign Out</span>
            </button>
          </div>
        </section>
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
    padding: '40px 0 60px 0',
    position: 'relative',
    overflow: 'hidden'
  },

  profileHeader: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    position: 'relative',
    zIndex: 1
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
    zIndex: 2
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

  // Quick Actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },

  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    background: 'linear-gradient(45deg, #ffd93d, #ffb347)',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(255, 217, 61, 0.3)',
    color: '#181c24'
  },

  actionIcon: {
    width: '32px',
    height: '32px'
  },

  actionText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#181c24'
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 20px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ff6b6b'
  },

  logoutText: {
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default Profile;
