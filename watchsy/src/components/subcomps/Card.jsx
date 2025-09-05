import React, { useState, useEffect } from "react";
import "./Card.css";
import star from "../../assets/star.png";
import { useUserData } from "../../hooks/useUserData";
import { emit, on } from "../../events/bus";
import { useToast } from "../ToastProvider";

function Card(props) {
  let movieId = -1;
  let ratings = props.rating;
  ratings = ratings.toFixed(1);

  const [watchStatus, setWatchStatus] = useState("none"); // "none", "watchLater", "watched"
  const [liked, setLiked] = useState(false);

  const {
    user,
    watchlist,
    watchedList,
    likedList,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addMovieToLiked,
    removeMovieFromLiked,
    isMovieInList,
  } = useUserData();

  const toast = useToast();

  const currentId = props.id || `${props.title}-${props.year}`;

  // Initialize from lists
  useEffect(() => {
    if (isMovieInList(currentId, 'watched')) {
      setWatchStatus('watched');
    } else if (isMovieInList(currentId, 'watchlist')) {
      setWatchStatus('watchLater');
    } else {
      setWatchStatus('none');
    }
    setLiked(isMovieInList(currentId, 'liked'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id, props.title, props.year]);

  // Sync with global list changes
  useEffect(() => {
    if (isMovieInList(currentId, 'watched')) {
      setWatchStatus('watched');
    } else if (isMovieInList(currentId, 'watchlist')) {
      setWatchStatus('watchLater');
    } else {
      setWatchStatus('none');
    }
    setLiked(isMovieInList(currentId, 'liked'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist, watchedList, likedList, props.id, props.title, props.year]);

  // Listen to overlay events for zero-read sync
  useEffect(() => {
    const handleLiked = (e) => {
      const { movieId: mId, liked: isLiked } = e.detail || {};
      if (String(mId) === String(currentId)) setLiked(!!isLiked);
    };
    const handleWatchlist = (e) => {
      const { movieId: mId, inWatchlist } = e.detail || {};
      if (String(mId) === String(currentId)) setWatchStatus(inWatchlist ? 'watchLater' : (watchStatus === 'watched' ? 'watched' : 'none'));
    };
    const handleWatched = (e) => {
      const { movieId: mId, watched } = e.detail || {};
      if (String(mId) === String(currentId)) setWatchStatus(watched ? 'watched' : (isMovieInList(currentId, 'watchlist') ? 'watchLater' : 'none'));
    };
    const off1 = on('movie:liked', handleLiked);
    const off2 = on('movie:watchlist', handleWatchlist);
    const off3 = on('movie:watched', handleWatched);
    return () => { off1(); off2(); off3(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, watchStatus]);

  const buildMovie = () => ({
    id: currentId,
    title: props.title,
    poster: props.poster,
    rating: props.rating,
    year: props.year,
    genres: props.genres,
  });

  const toggleWatchStatus = async () => {
    if (!user) return toast.info("Please login");
    const movie = buildMovie();

    if (watchStatus === 'watched') {
      toast.warn('This title is already marked as watched. Remove it from watched to add to watchlist.');
      return;
    }

    if (watchStatus === "none") {
      // Optimistic add to watchlist
      setWatchStatus("watchLater");
      emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
      addMovieToWatchlist(movie).then((res) => {
        if (!res.success) {
          setWatchStatus("none");
          emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
          toast.error(res.error || "Failed to add to watchlist");
        }
      }).catch(() => {
        setWatchStatus("none");
        emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
        toast.error("Failed to add to watchlist");
      });
    } else if (watchStatus === "watchLater") {
      // Optimistic remove from watchlist
      const prevStatus = watchStatus;
      setWatchStatus("none");
      emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
      removeMovieFromWatchlist(movie.id).then((res) => {
        if (!res.success) {
          setWatchStatus(prevStatus);
          emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
          toast.error(res.error || "Failed to remove from watchlist");
        }
      }).catch(() => {
        setWatchStatus(prevStatus);
        emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
        toast.error("Failed to remove from watchlist");
      });
    }
  };

  const toggleLiked = async () => {
    if (!user) return toast.info("Please login");
    const movie = buildMovie();

    if (isMovieInList(movie.id, 'liked')) {
      // Optimistic unlike
      const prev = liked;
      setLiked(false);
      emit('movie:liked', { movieId: movie.id, liked: false });
      removeMovieFromLiked(movie.id).then((res) => {
        if (!res.success) {
          setLiked(prev);
          emit('movie:liked', { movieId: movie.id, liked: prev });
          toast.error(res.error || "Failed to remove from liked");
        }
      }).catch(() => {
        setLiked(prev);
        emit('movie:liked', { movieId: movie.id, liked: prev });
        toast.error("Failed to remove from liked");
      });
    } else {
      // Optimistic like
      const prev = liked;
      setLiked(true);
      emit('movie:liked', { movieId: movie.id, liked: true });
      addMovieToLiked(movie).then((res) => {
        if (!res.success) {
          setLiked(prev);
          emit('movie:liked', { movieId: movie.id, liked: prev });
          toast.error(res.error || "Failed to add to liked");
        }
      }).catch(() => {
        setLiked(prev);
        emit('movie:liked', { movieId: movie.id, liked: prev });
        toast.error("Failed to add to liked");
      });
    }
  };

  const handleClick = () => {
    if (props.onSelect) props.onSelect();
  };

  const onPosterError = (e) => {
    const img = e.target;
    if (img.dataset.fallbackApplied === "true") return; // already swapped
    img.dataset.fallbackApplied = "true";
    img.src = "https://via.placeholder.com/500x750/1f2733/9fb3c8?text=No+Poster";
  };

  const getWatchButtonProps = () => {
    switch (watchStatus) {
      case "watchLater":
        return { text: " Remove", className: "btn-primary", icon: "❌" };
      case "watched":
        return { text: " Remove", className: "btn-primary", icon: "❌" };
      default:
        return { text: " Mark to Watch", className: "btn-primary", icon: "👀" };
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

        <div className="info-section">
          <div className="info-row">
            <span className="info-label">IMDB Rating:</span>
            <div className="rating-display">
              <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
              <span className="rating-text">{ratings}</span>
            </div>
          </div>
        </div>

        <hr className="divider-line" />

        <div className="action-buttons">
          <button
            type="button"
            className={watchButtonProps.className}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchStatus(); }}
          >
            {watchButtonProps.icon && typeof watchButtonProps.icon === 'string' ? watchButtonProps.icon : null}
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
              borderRadius: "10px",
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
        <hr className="divider-line" />
        <hr className="divider-line" />

        <div className="info-row">
          <span className="information">Click to see more info!</span>
        </div>
      </div>
    </div>

  );
}

export default Card;