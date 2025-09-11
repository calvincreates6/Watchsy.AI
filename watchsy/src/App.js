import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseConfig";
import Login from "./components/Login";
import Homepage from "./components/HomePage";
import Profile from "./components/Profile";
import Watchlist from "./components/Watchlist";
import LikedList from "./components/LikedList";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastProvider } from "./components/ToastProvider";
import SharePage from "./components/SharePage";
import AiPage from "./components/AiPage";
import CrewMember from "./components/CrewMember";
import PublicWatchlist from "./components/PublicWatchlist";
import PublicLikedList from "./components/PublicLikedList";
import About from "./components/static/About";
import Contact from "./components/static/Contact";
import Legal from "./components/static/Legal";

// Protected Route Component
function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%)',
        color: '#ffffff'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #d53369',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Public Route Component (for login page)
function PublicRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%)',
        color: '#ffffff'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #d53369',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } />
          <Route path="/search/:query" element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } />
          <Route path=":" element={<Navigate to="/" replace />} />
          <Route path=":slug/watchlist" element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          } />
          <Route path=":slug/likedlist" element={
            <ProtectedRoute>
              <LikedList />
            </ProtectedRoute>
          } />
          {/* Public shareable routes (read-only) */}
          <Route path="/s/watchlist/:slug" element={<PublicWatchlist />} />
          <Route path="/s/likedlist/:slug" element={<PublicLikedList />} />
          {/* Back-compat: old pattern /s/:slug/watchlist -> redirect */}
          <Route path="/s/:slug/watchlist" element={<Navigate to={"/s/watchlist/:slug"} replace />} />
          <Route path="/s/:slug/likedlist" element={<Navigate to={"/s/likedlist/:slug"} replace />} />
          <Route path="/share" element={
            <ProtectedRoute>
              <SharePage />
            </ProtectedRoute>
          } />
          {/* Static pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute>
              <AiPage />
            </ProtectedRoute>
          } />
          {/* Crew member page */}
          <Route path="/person/:personId" element={
            <ProtectedRoute>
              <CrewMember />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;