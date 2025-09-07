import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "./Watchlist.css";
import clock from "../assets/clock.png";
import eye from "../assets/eye.png";
import star from "../assets/star.png";
import checklist from "../assets/checklist.png";
import calendar from "../assets/calendar.png";
import { useUserData } from "../hooks/useUserData";
import { useToast } from "./ToastProvider";
import AdSlot from "./ads/AdSlot";

export default function Watchlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const qp = (searchParams.get('tab') || '').toLowerCase();
  const [activeTab, setActiveTab] = useState(qp === 'watched' ? 'watched' : 'watchLater'); // "watchLater" or "watched"
  const navigate = useNavigate();
  const isHero = !searchQuery.trim();
  const toast = useToast();

  const {
    user,
    loading,
    isLoading,
    watchlist,
    watchedList,
    addMovieToWatched,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    removeMovieFromWatched,
    isMovieInList,
  } = useUserData();

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const moveToWatched = async (movieId) => {
    if (!user) return toast.info("Please login");
    const movie = watchlist.find(m => m.id === movieId);
    if (!movie) return;
    if (isMovieInList(movie.id, 'watched')) {
      await removeMovieFromWatchlist(movie.id);
      return;
    }
    const added = await addMovieToWatched(movie);
    if (added.success) {
      await removeMovieFromWatchlist(movie.id);
      toast.success(`${movie.title} marked as watched`);
    } else if (added.error) {
      toast.error(added.error);
    }
  };

  const moveToWatchlist = async (movieId) => {
    if (!user) return toast.info("Please login");
    const movie = watchedList.find(m => m.id === movieId);
    if (!movie) return;
    if (isMovieInList(movie.id, 'watchlist')) {
      await removeMovieFromWatched(movie.id);
      return;
    }
    const added = await addMovieToWatchlist(movie);
    if (added.success) {
      await removeMovieFromWatched(movie.id);
      toast.success(`${movie.title} moved back to Watch Later`);
    } else if (added.error) {
      toast.error(added.error);
    }
  };

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

  const watchedSorted = (watchedList || []).slice().sort((a, b) => getWatchedTime(b) - getWatchedTime(a));

  const totalMovies = (watchlist?.length || 0) + (watchedList?.length || 0);

  if (loading || isLoading) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="watchlist-container">
          <div className="watchlist-header"><h1>Loading...</h1></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="watchlist-container">
          <div className="watchlist-header">
            <h1>My Lists</h1>
            <p>Please login to view your lists.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
      {/* Fixed sidebar ad that uses remaining viewport width; hidden on smaller screens */}
      {(typeof window === 'undefined' || window.innerWidth >= 1280) && (
        <div style={{ position: 'fixed', left: 5, top: 120, width: 150, zIndex: 2 }}>
          <AdSlot type="sidebar" label="Sponsored • Deals for movie buffs" style={{ width: 150 }} />
        </div>
      )}
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
            <img src={checklist} alt="Watch Later" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
            Watch Later ({watchlist.length})
          </button>
          <button 
            className={`toggle-btn ${activeTab === "watched" ? "active" : ""}`}
            onClick={() => setActiveTab("watched")}
          >
            <img src={eye} alt="Watched" style={{ width: "25px", height: "25px", marginRight: "16px" }} />
            Already Watched ({watchedList.length})
          </button>

          <button className="add-list-btn" onClick={() => toast.info("customizable lists coming soon!")}> 
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
            <h2>
              <img src={checklist} alt="Watch Later" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Watch Later
            </h2>
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
                        <span className="rating">
                          <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                          {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                        </span>
                        <span className="year">
                          <img src={calendar} alt="Year" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                          {movie.year}
                        </span>
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
                          <img src={eye} alt="Watched" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
                          Mark as Watched
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => removeMovieFromWatchlist(movie.id)}
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
            <h2>
              <img src={eye} alt="Watched" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Already Watched
            </h2>
            {watchedList.length === 0 ? (
              <p className="empty-message">No movies marked as watched yet. Watch some movies and mark them!</p>
            ) : (
              <div className="watchlist-grid">
                {watchedSorted.map((movie) => (
                  <div key={movie.id} className="watchlist-card watched">
                    <img src={movie.poster} alt={movie.title} className="watchlist-poster" />
                    <div className="watchlist-content">
                      <h3 className="watchlist-title">{movie.title}</h3>
                      <div className="watchlist-info">
                        <span className="rating">
                          <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                          {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                        </span>
                        <span className="year">
                          <img src={calendar} alt="Year" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                          {movie.year}
                        </span>
                        {movie.watchedAt && (
                          <span className="watched-date">
                            <img src={eye} alt="Watched" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                            {new Date(getWatchedTime(movie)).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="watchlist-genres">
                        {movie.genres?.map((genre, idx) => (
                          <span key={idx} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                      <div className="watchlist-actions">
                        <button 
                          className="btn-primary"
                          onClick={() => moveToWatchlist(movie.id)}
                        >
                          <img src={clock} alt="Watch Later" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
                          Move to Watch Later
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => removeMovieFromWatched(movie.id)}
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