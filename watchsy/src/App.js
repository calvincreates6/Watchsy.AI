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
        background: 'var(--color-bg)',
        color: 'var(--color-text)'
      }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Public Route Component (redirects to home if already authenticated)
function PublicRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)'
      }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;