import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "./LikedList.css";
import heart from "../assets/heart.png";
import star from "../assets/star.png";
import calendar from "../assets/calendar.png";
import { useUserData } from "../hooks/useUserData";
import { useToast } from "./ToastProvider";
import AdSlot from "./ads/AdSlot";

export default function LikedList() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isHero = !searchQuery.trim();
  const toast = useToast();

  const {
    user,
    loading,
    isLoading,
    likedList,
    addMovieToWatchlist,
    removeMovieFromLiked,
    isMovieInList,
    toggleFavorite,
  } = useUserData();

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleAddToWatchlist = async (movie) => {
    if (!user) return toast.info("Please login to add to watchlist");
    if (isMovieInList(movie.id, 'watchlist')) {
      return toast.warn(`${movie.title} is already in your watchlist!`);
    }
    const result = await addMovieToWatchlist(movie);
    if (result.success) {
      toast.success(`${movie.title} added to watchlist!`);
    } else {
      toast.error(result.error || "Failed to add to watchlist");
    }
  };

  const handleRemoveFromLiked = async (movieId) => {
    if (!user) return toast.info("Please login to remove from liked");
    const result = await removeMovieFromLiked(movieId);
    if (!result.success) {
      toast.error(result.error || "Failed to remove from liked");
    }
  };

  const onToggleFavorite = async (movie) => {
    const res = await toggleFavorite(movie.id);
    if (!res?.success) {
      if (res?.error) toast.error(res.error);
    } else {
      toast.success(movie.favorite ? "Removed from favorites" : "Marked as favorite");
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="likedlist-container">
          <div className="likedlist-header"><h1>Loading...</h1></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="likedlist-container">
          <div className="likedlist-header">
            <h1>Your Liked Movies</h1>
            <p>Please login to view your liked movies.</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!likedList || likedList.length === 0) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="likedlist-container">
          <div className="likedlist-header">
            <h1> Your Liked Movies</h1>
            <p>No movies in your liked list yet. Start liking movies using the "Liked" button!</p>
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
          <AdSlot type="sidebar" label="Sponsored • Premium picks for you" style={{ width: 150 }} />
        </div>
      )}
      <div className="likedlist-container">
        <div className="likedlist-header">
          <h1> Your Liked Movies</h1>
          <p>{likedList.length} movie{likedList.length !== 1 ? 's' : ''} in your liked list</p>
        </div>
        
        <div className="likedlist-grid">
          {likedList.map((movie) => (
            <div key={movie.id} className={`likedlist-card${movie.favorite ? ' favorite' : ''}`}>
              <img src={movie.poster} alt={movie.title} className="likedlist-poster" />
              <div className="likedlist-content">
                <h3 className="likedlist-title">{movie.title}</h3>
                <div className="likedlist-info">
                  <span className="rating">
                    <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                    {typeof movie.rating === 'number' ? movie.rating : movie.rating?.toString?.()}
                  </span>
                  <span className="year">
                    <img src={calendar} alt="Year" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                    {movie.year}
                  </span>
                </div>
                <div className="likedlist-genres">
                  {movie.genres?.map((genre, idx) => (
                    <span key={idx} className="genre-tag">{genre}</span>
                  ))}
                </div>
                <div className="likedlist-actions">
                  <button 
                    className={`btn-${movie.favorite ? 'primary' : 'secondary'}`}
                    onClick={() => onToggleFavorite(movie)}
                  >
                    {movie.favorite ? '💖 Favorite' : '🤍 Add to Favorites'}
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => handleAddToWatchlist(movie)}
                  >
                    🔁 Add to Watch Again
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleRemoveFromLiked(movie.id)}
                  >
                    💔 Remove
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
