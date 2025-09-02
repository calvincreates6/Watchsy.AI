import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "./Watchlist.css";

export default function Watchlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("watchLater"); // "watchLater" or "watched"
  const navigate = useNavigate();
  const isHero = !searchQuery.trim();
  const [watchlist, setWatchlist] = useState([]);
  const [watchedList, setWatchedList] = useState([]);

  useEffect(() => {
    // Load both lists from localStorage on component mount
    const savedWatchlist = localStorage.getItem("watchlist") || "[]";
    const savedWatchedList = localStorage.getItem("watchedList") || "[]";
    
    setWatchlist(JSON.parse(savedWatchlist));
    setWatchedList(JSON.parse(savedWatchedList));
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

  const removeFromWatched = (movieId) => {
    const updatedWatchedList = watchedList.filter(movie => movie.id !== movieId);
    setWatchedList(updatedWatchedList);
    localStorage.setItem("watchedList", JSON.stringify(updatedWatchedList));
  };

  const moveToWatched = (movieId) => {
    const movie = watchlist.find(m => m.id === movieId);
    if (movie) {
      // Remove from watchlist
      const updatedWatchlist = watchlist.filter(m => m.id !== movieId);
      setWatchlist(updatedWatchlist);
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      
      // Add to watched list
      const movieWithWatchedDate = { ...movie, watchedAt: new Date().toISOString() };
      const updatedWatchedList = [...watchedList, movieWithWatchedDate];
      setWatchedList(updatedWatchedList);
      localStorage.setItem("watchedList", JSON.stringify(updatedWatchedList));
    }
  };

  const moveToWatchlist = (movieId) => {
    const movie = watchedList.find(m => m.id === movieId);
    if (movie) {
      // Remove from watched list
      const updatedWatchedList = watchedList.filter(m => m.id !== movieId);
      setWatchedList(updatedWatchedList);
      localStorage.setItem("watchedList", JSON.stringify(updatedWatchedList));
      
      // Add back to watchlist
      const movieWithAddedDate = { ...movie, addedAt: new Date().toISOString() };
      delete movieWithAddedDate.watchedAt; // Remove watched date
      const updatedWatchlist = [...watchlist, movieWithAddedDate];
      setWatchlist(updatedWatchlist);
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
    }
  };

  const totalMovies = watchlist.length + watchedList.length;

  if (totalMovies === 0) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="watchlist-container">
          <div className="watchlist-header">
            <h1>My Lists</h1>
            <p>No movies in your lists yet. Add some movies using the buttons on movie cards!</p>
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
          <h1>My Lists</h1>
          <p>{totalMovies} movie{totalMovies !== 1 ? 's' : ''} total</p>
        </div>

        {/* Toggle Buttons */}
        <div className="list-toggle">
          <button 
            className={`toggle-btn ${activeTab === "watchLater" ? "active" : ""}`}
            onClick={() => setActiveTab("watchLater")}
          >
            ⏰ Watch Later ({watchlist.length})
          </button>
          <button 
            className={`toggle-btn ${activeTab === "watched" ? "active" : ""}`}
            onClick={() => setActiveTab("watched")}
          >
            ✅ Already Watched ({watchedList.length})
          </button>

          <button className="add-list-btn" onClick={() => alert("customizable lists coming soon!")}>
            <span><svg
  xmlns="http://www.w3.org/2000/svg"
  x="0px"
  y="0px"
  width="30"
  height="30"
  viewBox="0 0 256 256"
>
  <g
    fill="#ffffff"
    opacity="0.8"
    fillRule="evenodd"
    stroke="none"
    strokeWidth="1"
    strokeLinecap="butt"
    strokeLinejoin="miter"
    strokeMiterlimit="10"
    strokeDasharray="none"
    strokeDashoffset="0"
    fontFamily="none"
    fontWeight="none"
    fontSize="none"
    textAnchor="none"
    style={{ mixBlendMode: "normal" }}
  >
    <g transform="scale(10.66667,10.66667)">
      <path d="M11,2v9h-9v2h9v9h2v-9h9v-2h-9v-9z"></path>
    </g>
  </g>
</svg>
</span>
          </button>
        </div>
        
        {/* Watch Later Section */}
        {activeTab === "watchLater" && (
          <div className="list-section">
            <h2>⏰ Watch Later</h2>
            {watchlist.length === 0 ? (
              <p className="empty-message">No movies in your watch later list. Start adding movies!</p>
            ) : (
              <div className="watchlist-grid">
                {watchlist.map((movie) => (
                  <div key={movie.id} className="watchlist-card">
                    <img src={movie.poster} alt={movie.title} className="watchlist-poster" />
                    <div className="watchlist-content">
                      <h3 className="watchlist-title">{movie.title}</h3>
                      <div className="watchlist-info">
                        <span className="rating">⭐ {movie.rating.toFixed(1)}</span>
                        <span className="year">📅 {movie.year}</span>
                      </div>
                      <div className="watchlist-genres">
                        {movie.genres?.map((genre, idx) => (
                          <span key={idx} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                      <div className="watchlist-actions">
                        <button 
                          className="btn-primary"
                          onClick={() => moveToWatched(movie.id)}
                        >
                          ✅ Mark as Watched
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
            )}
          </div>
        )}

        {/* Already Watched Section */}
        {activeTab === "watched" && (
          <div className="list-section">
            <h2>✅ Already Watched</h2>
            {watchedList.length === 0 ? (
              <p className="empty-message">No movies marked as watched yet. Watch some movies and mark them!</p>
            ) : (
              <div className="watchlist-grid">
                {watchedList.map((movie) => (
                  <div key={movie.id} className="watchlist-card watched">
                    <img src={movie.poster} alt={movie.title} className="watchlist-poster" />
                    <div className="watchlist-content">
                      <h3 className="watchlist-title">{movie.title}</h3>
                      <div className="watchlist-info">
                        <span className="rating">⭐ {movie.rating.toFixed(1)}</span>
                        <span className="year">📅 {movie.year}</span>
                        {movie.watchedAt && (
                          <span className="watched-date">👁️ {new Date(movie.watchedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="watchlist-genres">
                        {movie.genres?.map((genre, idx) => (
                          <span key={idx} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                      <div className="watchlist-actions">
                        <button 
                          className="btn-secondary"
                          onClick={() => moveToWatchlist(movie.id)}
                        >
                          ⏰ Move to Watch Later
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => removeFromWatched(movie.id)}
                        >
                          ❌ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
} 