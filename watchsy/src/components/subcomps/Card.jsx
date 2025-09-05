import React, { useState, useEffect } from "react";
import "./Card.css";
import star from "../../assets/star.png";
import { useUserData } from "../../hooks/useUserData";

function Card(props) {
  let movieId = -1;
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  const [watchStatus, setWatchStatus] = useState("none"); // "none", "watchLater"
  const [liked, setLiked] = useState(false);

  const {
    user,
    watchlist,
    likedList,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addMovieToLiked,
    removeMovieFromLiked,
    isMovieInList,
  } = useUserData();

  // Set initial states based on lists
  useEffect(() => {
    const currentId = props.id || `${props.title}-${props.year}`;
    if (isMovieInList(currentId, 'watchlist')) {
      setWatchStatus("watchLater");
    } else {
      setWatchStatus("none");
    }
    setLiked(isMovieInList(currentId, 'liked'));
  }, [props.id, props.title, props.year]);

  // Keep in sync with global list changes (overlay <-> card)
  useEffect(() => {
    const currentId = props.id || `${props.title}-${props.year}`;
    setWatchStatus(isMovieInList(currentId, 'watchlist') ? 'watchLater' : 'none');
    setLiked(isMovieInList(currentId, 'liked'));
  }, [watchlist, likedList, props.id, props.title, props.year]);

  const buildMovie = () => ({
    id: props.id || `${props.title}-${props.year}`,
    title: props.title,
    poster: props.poster,
    rating: props.rating,
    year: props.year,
    genres: props.genres,
  });

  const toggleWatchStatus = async () => {
    if (!user) return alert("Please login");
    const movie = buildMovie();

    if (watchStatus === "none") {
      // Optimistic add to watchlist
      setWatchStatus("watchLater");
      addMovieToWatchlist(movie).then((res) => {
        if (!res.success) {
          setWatchStatus("none");
          alert(res.error || "Failed to add to watchlist");
        }
      }).catch(() => {
        setWatchStatus("none");
        alert("Failed to add to watchlist");
      });
    } else if (watchStatus === "watchLater") {
      // Optimistic remove from watchlist
      const prevStatus = watchStatus;
      setWatchStatus("none");
      removeMovieFromWatchlist(movie.id).then((res) => {
        if (!res.success) {
          setWatchStatus(prevStatus);
          alert(res.error || "Failed to remove from watchlist");
        }
      }).catch(() => {
        setWatchStatus(prevStatus);
        alert("Failed to remove from watchlist");
      });
    }
  };

  const toggleLiked = async () => {
    if (!user) return alert("Please login");
    const movie = buildMovie();

    if (isMovieInList(movie.id, 'liked')) {
      // Optimistic unlike
      const prev = liked;
      setLiked(false);
      removeMovieFromLiked(movie.id).then((res) => {
        if (!res.success) {
          setLiked(prev);
          alert(res.error || "Failed to remove from liked");
        }
      }).catch(() => {
        setLiked(prev);
        alert("Failed to remove from liked");
      });
    } else {
      // Optimistic like
      const prev = liked;
      setLiked(true);
      addMovieToLiked(movie).then((res) => {
        if (!res.success) {
          setLiked(prev);
          alert(res.error || "Failed to add to liked");
        }
      }).catch(() => {
        setLiked(prev);
        alert("Failed to add to liked");
      });
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
          text: "Remove",
          className: "btn-primary",
          icon: "❌"
        };
      default:
        return {
          text: "Mark to Watch",
          className: "btn-primary",
          icon: "👀"
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
              <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
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
            type="button"
            className={watchButtonProps.className}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchStatus(); }}
          >
            {watchButtonProps.icon && typeof watchButtonProps.icon === 'string' ? (
              watchButtonProps.icon
            ) : null}
            {watchButtonProps.text}
          </button>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLiked(); }}
            style={{
              background: liked ? "rgba(255, 107, 107, 0.3)" : "rgba(255, 107, 107, 0.1)",
              color: "#ff6b6b",
              border: "1px solid rgba(255, 107, 107, 0.3)",
              padding: "10px 16px",
              borderRadius: "20px",
              fontWeight: "600",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {liked ? "💖 Liked" : "❤️ Like"}
          </button>
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