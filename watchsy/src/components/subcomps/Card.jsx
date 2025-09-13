import React, { useState, useEffect } from "react";
import "./Card.css";
import star from "../../assets/star.png";
import { useUserData } from "../../hooks/useUserData";
import { emit, on } from "../../events/bus";
import { useToast } from "../ToastProvider";
import posterFiller from "../../assets/posterFiller.jpg";
import { voteOnMovie, getUserVote, getMovieVotes } from "../../services/votes-real";

function Card(props) {
  let movieId = -1;
  let ratings = props.rating || 0;
  ratings = (ratings || 0).toFixed(1);

  const [watchStatus, setWatchStatus] = useState("none"); // "none", "watchLater", "watched"
  const [liked, setLiked] = useState(false);
  const [userVote, setUserVote] = useState(0);
  const [movieVotes, setMovieVotes] = useState({ likes: 0, dislikes: 0, total: 0, likePercentage: 0 });
  const [voteLoading, setVoteLoading] = useState(false);

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

  const currentId = props.id || `${props.title}-${props.year}`;
  const toast = useToast();

  // Load votes when component mounts or user changes
  useEffect(() => {
    const loadVotes = async () => {
      try {
        console.log('Loading votes for movie:', currentId);
        const [userVoteResult, movieVotesResult] = await Promise.all([
          user ? getUserVote(user, currentId) : Promise.resolve({ success: true, vote: 0 }),
          getMovieVotes(currentId)
        ]);

        console.log('User vote result:', userVoteResult);
        console.log('Movie votes result:', movieVotesResult);

        if (userVoteResult.success) {
          setUserVote(userVoteResult.vote);
        }

        if (movieVotesResult.success) {
          setMovieVotes(movieVotesResult.votes);
          console.log('Set movie votes:', movieVotesResult.votes);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
      }
    };

    loadVotes();
  }, [currentId, user]);

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
        toast.error("Failed to remove from liked");
      });
    }
  };

  const handleVote = async (voteValue) => {
    if (!user) {
      toast.info("Please sign in to vote");
      return;
    }

    console.log('Voting:', { voteValue, currentId, user: user.uid });
    setVoteLoading(true);
    try {
      const result = await voteOnMovie(user, currentId, voteValue);
      console.log('Vote result:', result);
      
      if (result.success) {
        setUserVote(voteValue);
        toast.success(`Vote recorded! ${voteValue === 1 ? 'Liked' : 'Disliked'} this movie.`);
        
        // Refresh vote counts after a delay
        setTimeout(async () => {
          try {
            const movieVotesResult = await getMovieVotes(currentId);
            console.log('Refreshed votes:', movieVotesResult);
            if (movieVotesResult.success) {
              setMovieVotes(movieVotesResult.votes);
            }
          } catch (error) {
            console.error('Error refreshing votes:', error);
          }
        }, 2000); // Increased delay to 2 seconds
      } else {
        toast.error(result.error || "Failed to vote");
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Failed to vote");
    } finally {
      setVoteLoading(false);
    }
  };

  const handleClick = () => {
    if (props.onSelect) props.onSelect();
  };

  const onPosterError = (e) => {
    const img = e.target;
    if (img.dataset.fallbackApplied === "true") return; // already swapped
    img.dataset.fallbackApplied = "true";
    img.src = posterFiller;
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
            {liked ? "👍 Liked" : "❤️ Like"}
          </button>
        </div>

        {/* Vote Buttons with percentages inside */}
        <div className="vote-buttons" style={{ display: "flex", marginTop: "14px", width: "80%", marginLeft: "10%" }}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(1); }}
            disabled={voteLoading}
            style={{
              // marginLeft: "8px",
              flex: 1,
              padding: "6px 1px",
              borderRadius: "24px 0px 0px 24px",
              border: "1px solid",
              background: userVote === 1 ? "rgba(74, 222, 128, 0.2)" : "rgba(74, 222, 128, 0.1)",
              borderColor: userVote === 1 ? "#4ade80" : "rgba(74, 222, 128, 0.3)",
              color: userVote === 1 ? "#4ade80" : "#b8c5d6",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: voteLoading ? 0.6 : 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              justifyContent: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* <span>👍</span> */}
              <span>Like</span>
            </div>
            <div style={{ fontSize: "10px", opacity: 0.8 }}>
              {movieVotes.total > 0 ? `${movieVotes.likePercentage}%` : '0%'}
            </div>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(-1); }}
            disabled={voteLoading}
            style={{
              flex: 1,
              padding: "6px 1px",
              borderRadius: "0px 24px 24px 0px",
              border: "1px solid",
              background: userVote === -1 ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
              borderColor: userVote === -1 ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
              color: userVote === -1 ? "#ef4444" : "#b8c5d6",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: voteLoading ? 0.6 : 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              justifyContent: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* <span>👎</span> */}
              <span>Dislike</span>
            </div>
            <div style={{ fontSize: "10px", opacity: 0.8 }}>
              {movieVotes.total > 0 ? `${100 - movieVotes.likePercentage}%` : '0%'}
            </div>
          </button>
        </div>

        {/* Total votes display under buttons - always show */}
        <div style={{ 
          textAlign: "center", 
          marginTop: "6px", 
          fontSize: "11px", 
          color: "#8b949e",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>Total votes: <strong style={{ color: "#ffd93d" }}>{movieVotes.total}</strong></span>
          <span style={{ color: "#666" }}>•</span>
          <span>👍 {movieVotes.likes}</span>
          <span style={{ color: "#666" }}>•</span>
          <span>👎 {movieVotes.dislikes}</span>
        </div>

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
