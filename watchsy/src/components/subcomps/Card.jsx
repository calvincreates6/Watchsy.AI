import React, { useState, useEffect } from "react";
import "./Card.css";

function Card(props) {
  let movieId = -1;
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  const [watchStatus, setWatchStatus] = useState("none"); // "none", "watchLater", "watched"

  // Check current status when component mounts
  useEffect(() => {
    const movieId = props.id || `${props.title}-${props.year}`;
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const watchedList = JSON.parse(localStorage.getItem("watchedList") || "[]");
    
    if (watchlist.find(m => m.id === movieId)) {
      setWatchStatus("watchLater");
    } else if (watchedList.find(m => m.id === movieId)) {
      setWatchStatus("watched");
    } else {
      setWatchStatus("none");
    }
  }, [props.id, props.title, props.year]);

  const toggleWatchStatus = () => {
    const movie = {
      id: props.id || `${props.title}-${props.year}`,
      title: props.title,
      poster: props.poster,
      rating: props.rating,
      year: props.year,
      genres: props.genres,
    };

    if (watchStatus === "none") {
      // Add to watch later
      const existingWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      const movieExists = existingWatchlist.find(m => m.id === movie.id);
      if (!movieExists) {
        const updatedWatchlist = [...existingWatchlist, { ...movie, addedAt: new Date().toISOString() }];
        localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
        setWatchStatus("watchLater");
        alert(`${props.title} added to watch later!`);
      }
    } else if (watchStatus === "watchLater") {
      // Move to watched
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      const watchedList = JSON.parse(localStorage.getItem("watchedList") || "[]");
      
      // Remove from watchlist
      const updatedWatchlist = watchlist.filter(m => m.id !== movie.id);
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      
      // Add to watched
      const updatedWatchedList = [...watchedList, { ...movie, watchedAt: new Date().toISOString() }];
      localStorage.setItem("watchedList", JSON.stringify(updatedWatchedList));
      setWatchStatus("watched");
      alert(`${props.title} marked as watched!`);
    } else if (watchStatus === "watched") {
      // Remove from watched
      const watchedList = JSON.parse(localStorage.getItem("watchedList") || "[]");
      const updatedWatchedList = watchedList.filter(m => m.id !== movie.id);
      localStorage.setItem("watchedList", JSON.stringify(updatedWatchedList));
      setWatchStatus("none");
      alert(`${props.title} removed from watched list!`);
    }
  };

  const addToLikedList = () => {
    const movie = {
      id: props.id || `${props.title}-${props.year}`,
      title: props.title,
      poster: props.poster,
      rating: props.rating,
      year: props.year,
      genres: props.genres,
      likedAt: new Date().toISOString(),
      favorite: false
    };

    const existingLikedList = JSON.parse(localStorage.getItem("likedList") || "[]");
    const movieExists = existingLikedList.find(m => m.id === movie.id);
    
    if (!movieExists) {
      const updatedLikedList = [...existingLikedList, movie];
      localStorage.setItem("likedList", JSON.stringify(updatedLikedList));
      alert(`${props.title} added to liked movies!`);
    } else {
      alert(`${props.title} is already in your liked movies!`);
    }
  };

  // Use provided onSelect to notify parent which card was clicked
  const handleClick = () => {
    if (props.onSelect) props.onSelect();
  };

  // Safe image error handler to avoid infinite onError loop/flicker
  const onPosterError = (e) => {
    const img = e.target;
    if (img.dataset.fallbackApplied === "true") return; // already swapped
    img.dataset.fallbackApplied = "true";
    img.src = "https://via.placeholder.com/500x750/1f2733/9fb3c8?text=No+Poster";
  };

  // Get button text and styling based on current status
  const getWatchButtonProps = () => {
    switch (watchStatus) {
      case "watchLater":
        return {
          text: "⏰ Watch Later",
          className: "btn-primary",
          icon: "⏰"
        };
      case "watched":
        return {
          text: "✅ Watched",
          className: "btn-secondary watched",
          icon: "✅"
        };
      default:
        return {
          text: "👁️ Mark to Watch",
          className: "btn-secondary",
          icon: "👁️"
        };
    }
  };

  const watchButtonProps = getWatchButtonProps();

  return (
    <div className="movie-card" id={props.id} onClick={handleClick}>
      <div className="content-wrapper" >
        <img 
          src={props.poster} 
          alt={`${props.title} poster`} 
          className="movie-poster"
          onError={onPosterError}
        />

        <h2 className="movie-title">{props.title}</h2>

        {/* <hr className="divider-line" /> */}

        <div className="info-section">
          <div className="info-row">
            <span className="info-label">IMDB Rating:</span>
            <div className="rating-display">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gold" viewBox="0 0 16 16">
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
              </svg>
              <span className="rating-text">{ratings}</span>
            </div>
          </div>

{/* 
          <div className="info-row">
            <span className="info-label">Release Year:</span>
            <span className="detail-text">{props.year}</span>
          </div> */}

          {/* <div className="info-row">
            <span className="info-label">Genres:</span>
            <div className="genre-list">
              {props.genres.map((genre, idx) => (
                <span key={idx} className="genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          </div> */}
        </div>

        <hr className="divider-line" />

        <div className="action-buttons">
          <button 
            className={watchButtonProps.className}
            onClick={(e) => { e.stopPropagation(); toggleWatchStatus(); }}
          >
            {watchButtonProps.text}
          </button>
          <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); addToLikedList(); }}>❤️ Liked</button>
        </div>

        <hr className="divider-line" />

        <div className="info-row">
          <span className="information">Click to see more info!</span>
        </div>
      </div>
    </div>

  );
}

export default Card;