import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "./Watchlist.css";

export default function Watchlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isHero = !searchQuery.trim();
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    // Load watchlist from localStorage on component mount
    const savedWatchlist = localStorage.getItem("watchlist");
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  const handleSearch = (query) => {
    if (query.trim()) {
      // Redirect to home page with search query
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const removeFromWatchlist = (movieId) => {
    const updatedWatchlist = watchlist.filter(movie => movie.id !== movieId);
    setWatchlist(updatedWatchlist);
    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
  };

  const markAsWatched = (movieId) => {
    const updatedWatchlist = watchlist.map(movie => 
      movie.id === movieId ? { ...movie, watched: !movie.watched } : movie
    );
    setWatchlist(updatedWatchlist);
    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
  };

  if (watchlist.length === 0) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="watchlist-container">
          <div className="watchlist-header">
            <h1>My Watchlist</h1>
            <p>No movies in your watchlist yet. Add some movies using the "Watch Later" button!</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header onSearch={handleSearch} transparent={isHero} />
      <div className="watchlist-container">
        <div className="watchlist-header">
          <h1>My Watchlist</h1>
          <p>{watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} in your watchlist</p>
        </div>
        
        <div className="watchlist-grid">
          {watchlist.map((movie) => (
            <div key={movie.id} className={`watchlist-card ${movie.watched ? 'watched' : ''}`}>
              <img src={movie.poster} alt={movie.title} className="watchlist-poster" />
              <div className="watchlist-content">
                <h3 className="watchlist-title">{movie.title}</h3>
                <div className="watchlist-info">
                  <span className="rating">⭐ {movie.rating}</span>
                  <span className="year">📅 {movie.year}</span>
                </div>
                <div className="watchlist-genres">
                  {movie.genres.map((genre, idx) => (
                    <span key={idx} className="genre-tag">{genre}</span>
                  ))}
                </div>
                <div className="watchlist-actions">
                  <button 
                    className={`btn-${movie.watched ? 'secondary' : 'primary'}`}
                    onClick={() => markAsWatched(movie.id)}
                  >
                    {movie.watched ? '✅ Watched' : '👁️ Mark Watched'}
                    </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => removeFromWatchlist(movie.id)}
                  >
                    ❌ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
} 