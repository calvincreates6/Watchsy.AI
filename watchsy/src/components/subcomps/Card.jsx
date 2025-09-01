import React from "react";
import "./Card.css";

function Card(props) {
  let movieId = -1;
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  const addToWatchlist = () => {
    const movie = {
      id: props.id || `${props.title}-${props.year}`,
      title: props.title,
      poster: props.poster,
      rating: props.rating,
      year: props.year,
      genres: props.genres,
      addedAt: new Date().toISOString()
    };

    const existingWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const movieExists = existingWatchlist.find(m => m.id === movie.id);
    if (!movieExists) {
      const updatedWatchlist = [...existingWatchlist, movie];
      localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
      alert(`${props.title} added to watchlist!`);
    } else {
      alert(`${props.title} is already in your watchlist!`);
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

        <hr className="divider-line" />

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
          <button className="btn-primary" onClick={(e) => { e.stopPropagation(); addToWatchlist(); }}>⏰ Watch Later</button>
          <button className="btn-secondary" onClick={(e) => e.stopPropagation()}>❤️ Liked</button>
          <button className="btn-secondary" onClick={(e) => e.stopPropagation()}>🔁 Rewatch</button>
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