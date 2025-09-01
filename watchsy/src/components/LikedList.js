import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer";
import "./LikedList.css";

export default function LikedList() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const isHero = !searchQuery.trim();
  const [likedList, setLikedList] = useState([]);

  useEffect(() => {
    // Load liked list from localStorage on component mount
    const savedLikedList = localStorage.getItem("likedList");
    if (savedLikedList) {
      setLikedList(JSON.parse(savedLikedList));
    }
  }, []);

  const handleSearch = (query) => {
    if (query.trim()) {
      // Redirect to home page with search query
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const removeFromLikedList = (movieId) => {
    const updatedLikedList = likedList.filter(movie => movie.id !== movieId);
    setLikedList(updatedLikedList);
    localStorage.setItem("likedList", JSON.stringify(updatedLikedList));
  };

  const addToWatchlist = (movie) => {
    const existingWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const movieExists = existingWatchlist.find(m => m.id === movie.id);
    
    if (!movieExists) {
      const updatedWatchlist = [...existingWatchlist, { ...movie, addedAt: new Date().toISOString() }];
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      alert(`${movie.title} added to watchlist!`);
    } else {
      alert(`${movie.title} is already in your watchlist!`);
    }
  };

  const toggleFavorite = (movieId) => {
    const updatedLikedList = likedList.map(movie => 
      movie.id === movieId ? { ...movie, favorite: !movie.favorite } : movie
    );
    setLikedList(updatedLikedList);
    localStorage.setItem("likedList", JSON.stringify(updatedLikedList));
  };

  if (likedList.length === 0) {
    return (
      <>
        <Header onSearch={handleSearch} transparent={isHero} />
        <div className="likedlist-container">
          <div className="likedlist-header">
            <h1> Your Liked Movies</h1>
            <p>No movies in your liked list yet. Start liking movies using the "❤️ Liked" button!</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header onSearch={handleSearch} transparent={isHero} />
      <div className="likedlist-container">
        <div className="likedlist-header">
          <h1> Your Liked Movies</h1>
          <p>{likedList.length} movie{likedList.length !== 1 ? 's' : ''} in your liked list</p>
        </div>
        
        <div className="likedlist-grid">
          {likedList.map((movie) => (
            <div key={movie.id} className={`likedlist-card ${movie.favorite ? 'favorite' : ''}`}>
              <img src={movie.poster} alt={movie.title} className="likedlist-poster" />
              <div className="likedlist-content">
                <h3 className="likedlist-title">{movie.title}</h3>
                <div className="likedlist-info">
                  <span className="rating">⭐ {movie.rating}</span>
                  <span className="year">📅 {movie.year}</span>
                </div>
                <div className="likedlist-genres">
                  {movie.genres?.map((genre, idx) => (
                    <span key={idx} className="genre-tag">{genre}</span>
                  ))}
                </div>
                <div className="likedlist-actions">
                  <button 
                    className={`btn-${movie.favorite ? 'primary' : 'secondary'}`}
                    onClick={() => toggleFavorite(movie.id)}
                  >
                    {movie.favorite ? '💖 Favorite' : '🤍 Add to Favorites'}
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => addToWatchlist(movie)}
                  >
                    🔁 Add to Watch Again
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => removeFromLikedList(movie.id)}
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
