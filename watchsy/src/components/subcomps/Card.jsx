import React, { useState, useEffect } from "react";
import "./Card.css";
import heart from "../../assets/heart.png";
import star from "../../assets/star.png";
import eye from "../../assets/eye.png";
import clock from "../../assets/clock.png";
import { useUserData } from "../../hooks/useUserData";

const icons = {
  clock: clock,
  eye: eye,
  heart: heart,
  star: star,
};

function Card(props) {
  let movieId = -1;
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  const [watchStatus, setWatchStatus] = useState("none"); // "none", "watchLater", "watched"

  const {
    user,
    watchlist,
    watchedList,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addMovieToWatched,
    removeMovieFromWatched,
    addMovieToLiked,
    removeMovieFromLiked,
    isMovieInList,
    loadUserData,
  } = useUserData();

  // Check current status when component mounts or lists change
  useEffect(() => {
    const currentId = props.id || `${props.title}-${props.year}`;
    if (isMovieInList(currentId, 'watchlist')) {
      setWatchStatus("watchLater");
    } else if (isMovieInList(currentId, 'watched')) {
      setWatchStatus("watched");
    } else {
      setWatchStatus("none");
    }
  }, [props.id, props.title, props.year, watchlist, watchedList, isMovieInList]);

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
      const res = await addMovieToWatchlist(movie);
      if (res.success) {
        setWatchStatus("watchLater");
        await loadUserData();
        alert(`${props.title} added to watch later!`);
      } else {
        alert(res.error || "Failed to add to watch later");
      }
    } else if (watchStatus === "watchLater") {
      // Move to watched
      const added = await addMovieToWatched(movie);
      if (added.success) {
        await removeMovieFromWatchlist(movie.id);
        setWatchStatus("watched");
        await loadUserData();
        alert(`${props.title} marked as watched!`);
      } else {
        alert(added.error || "Failed to mark as watched");
      }
    } else if (watchStatus === "watched") {
      const res = await removeMovieFromWatched(movie.id);
      if (res.success) {
        setWatchStatus("none");
        await loadUserData();
        alert(`${props.title} removed from watched list!`);
      } else {
        alert(res.error || "Failed to remove from watched");
      }
    }
  };

  const addToLikedList = async () => {
    if (!user) return alert("Please login");
    const movie = buildMovie();

    if (isMovieInList(movie.id, 'liked')) {
      const res = await removeMovieFromLiked(movie.id);
      if (res.success) {
        await loadUserData();
        alert(`${props.title} removed from liked movies!`);
      } else {
        alert(res.error || "Failed to remove from liked");
      }
    } else {
      const res = await addMovieToLiked(movie);
      if (res.success) {
        await loadUserData();
        alert(`${props.title} added to liked movies!`);
      } else {
        alert(res.error || "Failed to add to liked");
      }
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
          text: "Watch Later",
          className: "btn-primary",
          icon: "⏰"
        };
      case "watched":
        return {
          text: "Watched",
          className: "btn-primary",
          icon: "✅"
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
            ) : watchButtonProps.icon ? (
              <img src={watchButtonProps.icon} alt="Icon" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
            ) : null}
            {watchButtonProps.text}
          </button>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToLikedList(); }}
          >
            <img src={heart} alt="Heart" style={{ width: "25px", height: "25px", marginRight: "6px" }} />
            Liked
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