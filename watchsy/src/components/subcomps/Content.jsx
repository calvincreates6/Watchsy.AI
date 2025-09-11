import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import { searchMovies, fetchGenres, fetchPopularTopMovies, fetchWatchProviders, fetchTrailers, fetchCast, fetchSimilarMovies, fetchMovieDetails } from "../../api/tmdb";
import background from "../../assets/movie_bg.jpg";
import movieClapperboard from "../../assets/movie clapperboard.png";
import castAndCrew from "../../assets/cast and crew.png";
import buy from "../../assets/buy.png";
import tv from "../../assets/tv.png";
import star from "../../assets/star.png";
import heart from "../../assets/heart.png";
import reel from "../../assets/video reel.png";
import brokenHeart from "../../assets/broken heart.png";
import calendar from "../../assets/calendar.png";
import search from "../../assets/search.png";
import videoReel from "../../assets/video reel.png";
import camera from "../../assets/camera.png";
import checklist from "../../assets/checklist.png";
import { useUserData } from "../../hooks/useUserData";
import { useToast } from "../ToastProvider"; // Import useToast
import { emit, on } from "../../events/bus";
import AdSlot from "../ads/AdSlot";
import posterFiller from "../../assets/posterFiller.jpg";

function Content({ searchQuery }) {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState({});
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [cardOrder, setCardOrder] = useState([0, 1, 2]); // Track card order
  const [animatingCard, setAnimatingCard] = useState(null); // Track which card is animating
  const [selectedMovie, setSelectedMovie] = useState(null); // Modal selection
  const [providers, setProviders] = useState(null); // Watch providers for selected movie
  const [providersLoading, setProvidersLoading] = useState(false);
  const [trailer, setTrailer] = useState(null); // YouTube trailer for selected movie
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [cast, setCast] = useState(null); // Cast details for selected movie
  const [castLoading, setCastLoading] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]); // Similar movies
  const [similarLoading, setSimilarLoading] = useState(false);
  const [runtime, setRuntime] = useState(null);
  const [stickyActive, setStickyActive] = useState(false);
  const scrollAreaRef = useRef(null);

  // Movie status states for overlay buttons
  const [movieLiked, setMovieLiked] = useState(false);
  const [movieWatched, setMovieWatched] = useState(false);
  const [movieInWatchlist, setMovieInWatchlist] = useState(false);

  const {
    user,
    isLoading,
    watchlist,
    watchedList,
    likedList,
    isMovieInList,
    addMovieToLiked,
    removeMovieFromLiked,
    addMovieToWatched,
    removeMovieFromWatched,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
  } = useUserData();

  const toast = useToast(); // Initialize useToast

  // Listen to card events to reflect immediately in overlay
  useEffect(() => {
    const handleLiked = (e) => {
      const { movieId, liked } = e.detail || {};
      if (selectedMovie && String(selectedMovie.id) === String(movieId)) setMovieLiked(!!liked);
    };
    const handleWatchlist = (e) => {
      const { movieId, inWatchlist } = e.detail || {};
      if (selectedMovie && String(selectedMovie.id) === String(movieId)) setMovieInWatchlist(!!inWatchlist);
    };
    const off1 = on('movie:liked', handleLiked);
    const off2 = on('movie:watchlist', handleWatchlist);
    return () => { off1(); off2(); };
  }, [selectedMovie]);

  // Movie action functions
  const handleLikeMovie = async () => {
    if (!selectedMovie) return;
    if (!user) return toast.info("Please login");

    const movie = {
      id: selectedMovie.id,
      title: selectedMovie.title,
      poster: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : '',
      rating: selectedMovie.vote_average,
      year: selectedMovie.release_date?.split("-")[0],
      genres: selectedMovie.genre_ids ? selectedMovie.genre_ids.map(id => genres[id]).filter(Boolean) : []
    };

    if (isMovieInList(movie.id, 'liked')) {
      // Optimistic unlike
      setMovieLiked(false);
      emit('movie:liked', { movieId: movie.id, liked: false });
      removeMovieFromLiked(movie.id).then((res) => {
        if (!res.success) {
          setMovieLiked(true);
          emit('movie:liked', { movieId: movie.id, liked: true });
          toast.error(res.error || "Failed to remove from liked");
        }
      }).catch(() => {
        setMovieLiked(true);
        emit('movie:liked', { movieId: movie.id, liked: true });
        toast.error("Failed to remove from liked");
      });
    } else {
      // Optimistic like
      setMovieLiked(true);
      emit('movie:liked', { movieId: movie.id, liked: true });
      addMovieToLiked(movie).then((res) => {
        if (!res.success) {
          setMovieLiked(false);
          emit('movie:liked', { movieId: movie.id, liked: false });
          toast.error(res.error || "Failed to add to liked");
        }
      }).catch(() => {
        setMovieLiked(false);
        emit('movie:liked', { movieId: movie.id, liked: false });
        toast.error("Failed to add to liked");
      });
    }
  };

  const handleWatchedMovie = async () => {
    if (!selectedMovie) return;
    if (!user) return toast.info("Please login");

    const movie = {
      id: selectedMovie.id,
      title: selectedMovie.title,
      poster: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : '',
      rating: selectedMovie.vote_average,
      year: selectedMovie.release_date?.split("-")[0],
      genres: selectedMovie.genre_ids ? selectedMovie.genre_ids.map(id => genres[id]).filter(Boolean) : []
    };

    if (isMovieInList(movie.id, 'watched')) {
      const prev = movieWatched;
      setMovieWatched(false);
      removeMovieFromWatched(movie.id).then((res) => {
        if (!res.success) {
          setMovieWatched(prev);
          toast.error(res.error || "Failed to remove from watched");
        }
      }).catch(() => {
        setMovieWatched(prev);
        toast.error("Failed to remove from watched");
      });
      return;
    }

    if (isMovieInList(movie.id, 'watchlist')) {
      setMovieInWatchlist(false);
      emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
      removeMovieFromWatchlist(movie.id).catch(() => {
        setMovieInWatchlist(true);
        emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
      });
    }

    setMovieWatched(true);
    addMovieToWatched(movie).then((res) => {
      if (!res.success) {
        setMovieWatched(false);
        toast.error(res.error || "Failed to mark as watched");
      }
    }).catch(() => {
      setMovieWatched(false);
      toast.error("Failed to mark as watched");
    });
  };

  const handleAddToWatchlist = async () => {
    if (!selectedMovie) return;
    if (!user) return toast.info("Please login");

    if (isMovieInList(selectedMovie.id, 'watched')) {
      toast.warn(`${selectedMovie.title} is already marked as watched! Remove it from watched list first if you want to add it to watchlist.`);
      return;
    }

    const movie = {
      id: selectedMovie.id,
      title: selectedMovie.title,
      poster: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : '',
      rating: selectedMovie.vote_average,
      year: selectedMovie.release_date?.split("-")[0],
      genres: selectedMovie.genre_ids ? selectedMovie.genre_ids.map(id => genres[id]).filter(Boolean) : []
    };

    if (isMovieInList(movie.id, 'watchlist')) {
      setMovieInWatchlist(false);
      emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
      removeMovieFromWatchlist(movie.id).then((res) => {
        if (!res.success) {
          setMovieInWatchlist(true);
          emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
          toast.error(res.error || "Failed to remove from watchlist");
        }
      }).catch(() => {
        setMovieInWatchlist(true);
        emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
        toast.error("Failed to remove from watchlist");
      });
    } else {
      setMovieInWatchlist(true);
      emit('movie:watchlist', { movieId: movie.id, inWatchlist: true });
      addMovieToWatchlist(movie).then((res) => {
        if (!res.success) {
          setMovieInWatchlist(false);
          emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
          toast.error(res.error || "Failed to add to watchlist");
        }
      }).catch(() => {
        setMovieInWatchlist(false);
        emit('movie:watchlist', { movieId: movie.id, inWatchlist: false });
        toast.error("Failed to add to watchlist");
      });
    }
  };

  // Fetch genres
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreList = await fetchGenres();
        const genreMap = {};
        genreList.forEach((genre) => {
          genreMap[genre.id] = genre.name;
        });
        setGenres(genreMap);
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };
    loadGenres();
  }, []);

  // Fetch hero movies (popular top-rated movies)
  useEffect(() => {
    const loadHeroMovies = async () => {
      try {
        setHeroLoading(true);
        const topMovies = await fetchPopularTopMovies();
        setHeroMovies(topMovies);
      } catch (err) {
        setHeroMovies([]);
      } finally {
        setHeroLoading(false);
      }
    };
    loadHeroMovies();
  }, []);

  // Handle card click - move clicked card to back
  const handleCardClick = (clickedIndex) => {
    if (animatingCard !== null) return; // Prevent multiple animations

    setAnimatingCard(clickedIndex);

    // Add animation class to clicked card
    const cardElement = document.querySelector(`[data-card-index="${clickedIndex}"]`);
    if (cardElement) {
      cardElement.classList.add('moving-to-back');
    }

    // After animation, reorder cards
    setTimeout(() => {
      setCardOrder(prevOrder => {
        const newOrder = [...prevOrder];
        const clickedCard = newOrder[clickedIndex];
        newOrder.splice(clickedIndex, 1);
        newOrder.push(clickedCard);
        return newOrder;
      });

      // Remove animation classes and reset
      setTimeout(() => {
        if (cardElement) {
          cardElement.classList.remove('moving-to-back');
        }
        setAnimatingCard(null);
      }, 150); // Slightly longer to ensure smooth transition
    }, 600); // Match CSS animation duration with some buffer
  };

  useEffect(() => {
    const fetchMovies = async () => {
      if (!searchQuery.trim()) {
        setMovies([]);
        return;
      }
      setLoading(true);
      try {
        const results = await searchMovies(searchQuery);
        // Filter out movies with 0 rating for cleaner results
        const filtered = (results || []).filter(m => (m?.vote_average || 0) > 0);
        setMovies(filtered);
      } catch (err) {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [searchQuery]);

  const getGenreNames = (genreIds) =>
    genreIds.map((id) => genres[id]).filter(Boolean);

  const closeModal = () => {
    setSelectedMovie(null);
    setProviders(null);
    setTrailer(null);
    setCast(null);
    setSimilarMovies([]);
    setRuntime(null);
    // Clear movie status states
    setMovieLiked(false);
    setMovieWatched(false);
    setMovieInWatchlist(false);
  };
  const onSelectMovie = (movie) => setSelectedMovie(movie);

  // Load all movie data when a movie is selected
  useEffect(() => {
    const loadMovieData = async () => {
      if (!selectedMovie?.id) return;

      // Load providers
      try {
        setProvidersLoading(true);
        const region = Intl.DateTimeFormat().resolvedOptions().timeZone ? (navigator.language?.split('-')[1] || 'US') : 'US';
        const data = await fetchWatchProviders(selectedMovie.id, region.toUpperCase());
        setProviders(data);
      } catch (e) {
        setProviders(null);
      } finally {
        setProvidersLoading(false);
      }

      // Load trailers
      try {
        setTrailerLoading(true);
        const trailerData = await fetchTrailers(selectedMovie.id);
        setTrailer(trailerData);
      } catch (e) {
        setTrailer(null);
      } finally {
        setTrailerLoading(false);
      }

      // Load cast
      try {
        setCastLoading(true);
        const castData = await fetchCast(selectedMovie.id);
        setCast(castData);
      } catch (e) {
        setCast(null);
      } finally {
        setCastLoading(false);
      }

      // Load details (runtime)
      try {
        const details = await fetchMovieDetails(selectedMovie.id);
        setRuntime(details?.runtime || null);
      } catch (e) {
        setRuntime(null);
      }

      // Load similar movies
      try {
        setSimilarLoading(true);
        const similarData = await fetchSimilarMovies(selectedMovie.id);
        setSimilarMovies(similarData);
      } catch (e) {
        setSimilarMovies([]);
      } finally {
        setSimilarLoading(false);
      }
    };
    loadMovieData();
    // reset sticky state when opening a new movie
    setStickyActive(false);
  }, [selectedMovie]);

  // Check movie status when selected
  useEffect(() => {
    if (!selectedMovie) return;
    const movieId = selectedMovie.id;
    setMovieLiked((likedList || []).some(m => m.id === movieId));
    setMovieInWatchlist((watchlist || []).some(m => m.id === movieId));
    setMovieWatched((watchedList || []).some(m => m.id === movieId));
  }, [selectedMovie, watchlist, watchedList, likedList]);

  // Hero Section (unchanged UI)
  const HeroSection = () => (
    <div style={hero.container}>
      <div style={hero.overlay} />
      <div style={hero.content}>
        <div style={hero.textSection}>
          <h1 style={hero.title} className="content-title">
            Track What You Watch, <span style={hero.highlight}>Share What You Love</span>
          </h1>
          <p style={hero.subtitle} className="content-body">
            Discover, organize, and share your favorite movies and TV shows. Build your personal watchlist and connect with fellow movie enthusiasts.
          </p>
          <div style={hero.ctaSection}>
            <button
              style={hero.primaryButton}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              onClick={function(){
                const searchBar = document.getElementById('my-search-bar');
                if (searchBar) {
                  // Scroll to header smoothly
                  const header = document.querySelector('header');
                  if (header) {
                    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }

                  // Focus the search bar with a slight delay to ensure scroll completes
                  setTimeout(() => {
                    searchBar.focus();
                    searchBar.style.border = "2px solid #ffd93d";
                    searchBar.style.boxShadow = "0 0 15px rgba(255, 217, 61, 0.5)";

                    // Add a subtle cursor blink effect
                    searchBar.style.caretColor = "#ffd93d";

                    // Reset the highlight after a few seconds
                    setTimeout(() => {
                      searchBar.style.border = "1px solid gold";
                      searchBar.style.boxShadow = "none";
                      searchBar.style.caretColor = "#f5f6fa";
                    }, 3000);
                  }, 500);
                }
              }}
            >
              <img src={movieClapperboard} alt="Start" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Start Exploring
            </button>
            <button
              style={hero.secondaryButton}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}

            >
              <img src={checklist} alt="Watchlist" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              <a href="/watchlist" style={{ textDecoration: "none", color: "inherit" }}>Create Watchlist</a>
            </button>
          </div>
          <div style={hero.features}>
            <div style={hero.feature} className="accent-text">
              <img src={search} alt="Search" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Search & Discover
            </div>
            <div style={hero.feature} className="accent-text">
              <img src={heart} alt="Favorites" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Save Favorites
            </div>
            <div style={hero.feature} className="accent-text">
              <img src={castAndCrew} alt="Share" style={{ width: "25px", height: "25px", marginRight: "8px" }} />
              Share With Friends
            </div>
          </div>
        </div>
        <div style={hero.visualSection}>
          <div style={hero.movieStack}>
            {heroLoading ? (
              // Loading state for hero movies
              <>
                <div style={{ ...hero.movieCard, transform: "rotate(-8deg)", animation: "float 3s ease-in-out infinite alternate" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={movieClapperboard} alt="Movie" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(4deg)", animation: "float 3s ease-in-out infinite alternate 0.3s" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={videoReel} alt="Video" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(-2deg)", animation: "float 3s ease-in-out infinite alternate 0.6s" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={camera} alt="Camera" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
              </>
            ) : heroMovies.length > 0 ? (
              // Display actual movie posters with card order
              cardOrder.map((movieIndex, displayIndex) => {
                const movie = heroMovies[movieIndex];
                const rotation = displayIndex === 0 ? -8 : displayIndex === 1 ? 4 : -2;
                const animationDelay = displayIndex * 0.3;

                return (
                  <div
                    key={`${movie.id}-${displayIndex}`}
                    className="hero-movie-card"
                    data-card-index={displayIndex}
                    onClick={() => handleCardClick(displayIndex)}
                    onMouseEnter={(e) => e.target.style.boxShadow = "0 15px 35px rgba(0, 255, 255, 0.3)"}
                    onMouseLeave={(e) => e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"}
                    style={{
                      ...hero.movieCard,
                      transform: `rotate(${rotation}deg)`,
                      animation: `float 3s ease-in-out infinite alternate ${animationDelay}s`,
                      zIndex: displayIndex === 0 ? 30 : displayIndex === 1 ? 20 : 10,
                    }}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={movie.title}
                      style={hero.moviePoster}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={hero.fallbackEmoji} className="fallback-emoji">
                      <img
                        src={movieClapperboard}
                        alt="Movie"
                        style={{ width: "40px", height: "40px" }}
                      />
                    </div>
                    <div style={hero.movieRating} className="movie-rating">
                      <img src={star} alt="Rating" style={{ width: "25px", height: "25px", marginRight: "4px" }} />
                      {movie.vote_average.toFixed(1)}
                    </div>
                    <div style={hero.movieVotes} className="movie-votes">
                      {movie.vote_count >= 1000 ?
                        `${(movie.vote_count / 1000).toFixed(1)}K votes` :
                        `${movie.vote_count} votes`
                      }
                    </div>
                    <div style={hero.movieTitle} className="movie-title">
                      {movie.title}
                    </div>
                    <div style={hero.clickHint} className="click-hint">
                      Click to shuffle
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback if no movies found
              <>
                <div style={{ ...hero.movieCard, transform: "rotate(-8deg)", animation: "float 3s ease-in-out infinite alternate" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={movieClapperboard} alt="Movie" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(4deg)", animation: "float 3s ease-in-out infinite alternate 0.3s" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={videoReel} alt="Video" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(-2deg)", animation: "float 3s ease-in-out infinite alternate 0.6s" }}>
                  <div style={hero.loadingPlaceholder}>
                    <img src={camera} alt="Camera" style={{ width: "40px", height: "40px" }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(2deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
        `}
      </style>
    </div>
  );

  if (loading) return <div className="spinner">Loading...</div>;

  if (!searchQuery.trim()) return <HeroSection />;

  return (
    <div style={styles.container}>
      {movies.length > 0 ? (
        <>
          <div style={styles.searchHeader}>
            <h2 style={styles.searchTitle} className="content-title">Search Results for "{searchQuery}"</h2>
            <p style={styles.resultCount} className="content-body">{movies.length} movies found</p>
          </div>

          {/* Banner Ad under header */}
          <div style={{ maxWidth: 1200, margin: "0 auto 20px auto", padding: "0 16px" }}>
            <AdSlot type="banner" label="Sponsored • Watchsy" />
          </div>

          <div style={styles.movieGrid}>
            {movies.map((movie, idx) => {
              const posterUrl = movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : posterFiller;

              // Insert one inline ad after ~ every 8 items (first occurrence only)
              if (idx === 8) {
                return (
                  <React.Fragment key={`ad-${idx}`}>
                    <AdSlot
                      type="inline"
                      label="Sponsored • Recommended for cinephiles"
                      style={{ width: "100%", maxWidth: "350px", height: 530, borderRadius: 14 }}
                    />
                    <Card
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      poster={posterUrl}
                      rating={movie.vote_average}
                      year={movie.release_date?.split("-")[0]}
                      genres={getGenreNames(movie.genre_ids || [])}
                      onSelect={() => onSelectMovie(movie)}
                    />
                  </React.Fragment>
                );
              }

              return (
                <Card
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  poster={posterUrl}
                  rating={movie.vote_average}
                  year={movie.release_date?.split("-")[0]}
                  genres={getGenreNames(movie.genre_ids || [])}
                  onSelect={() => onSelectMovie(movie)}
                />
              );
            })}
          </div>

          {selectedMovie && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={closeModal}
              style={{
                position: "fixed",
                inset: 0,
                background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w1280${selectedMovie.poster_path}` : ''}) center/cover`,
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "20px",
                animation: "modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(1400px, 95vw)",
                  maxHeight: "90vh",
                  background: "linear-gradient(135deg, rgba(35, 43, 59, 0.95) 0%, rgba(24, 28, 36, 0.95) 100%)",
                  backdropFilter: "blur(20px)",
                  color: "#e6edf6",
                  borderRadius: "24px",
                  boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255, 217, 61, 0.2)",
                  overflow: "hidden",
                  position: "relative",
                  animation: "modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#f5f6fa",
                    fontSize: "20px",
                    transition: "all 0.2s ease",
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255,75,75,0.8)";
                    e.target.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(0,0,0,0.6)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  ✕
                </button>

                <div style={{
                  display: "flex",
                  gap: "32px",
                  padding: "32px",
                  flexDirection: window.innerWidth < 768 ? "column" : "row",
                  alignItems: window.innerWidth < 768 ? "center" : "flex-start",
                  overflow: "auto",
                  maxHeight: "calc(90vh - 100px)"
                }}
                ref={scrollAreaRef}
                onScroll={() => {
                  const scroller = scrollAreaRef.current;
                  if (!scroller) return;
                  const threshold = 120; // px before sticking
                  if (scroller.scrollTop > threshold && !stickyActive) setStickyActive(true);
                  else if (scroller.scrollTop <= threshold && stickyActive) setStickyActive(false);
                }}
                >
                  {/* Media Section - Trailer or Poster */}
                  <div style={{
                    flexShrink: 0,
                    width: window.innerWidth < 768 ? "100%" : "450px",
                                position: window.innerWidth < 768 ? "relative" : "sticky",
            top: window.innerWidth < 768 ? undefined : "24px",
                    alignSelf: window.innerWidth < 768 ? "stretch" : "flex-start",
                    zIndex: 2
                  }}>
                    {trailerLoading ? (
                      <div style={{
                        width: "100%",
                        height: window.innerWidth < 768 ? "225px" : "300px",
                        background: "#1a1c24",
                        borderRadius: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#b8c5d6"
                      }}>
                        Loading trailer...
                      </div>
                    ) : trailer ? (
                      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: "16px", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0&modestbranding=1`}
                          title={`${selectedMovie.title} Trailer`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            borderRadius: "16px"
                          }}
                        />
                      </div>
                    ) : (
                      <img
                        src={selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : posterFiller}
                        alt={`${selectedMovie.title} poster`}
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: window.innerWidth < 768 ? "400px" : "500px",
                          objectFit: "cover",
                          borderRadius: "16px",
                          boxShadow: "0 12px 40px rgba(0,0,0,0.4)"
                        }}
                      />
                    )}
                  </div>

                  {/* Content Section */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="content-title" style={{
                      marginTop: 0,
                      fontSize: "2.4rem",
                      marginBottom: "20px",
                      background: "linear-gradient(45deg, #ffd93d, #ff6b6b)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      lineHeight: "1.2",
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: "700",
                      letterSpacing: "-0.02em"
                    }}>
                      {selectedMovie.title}
                    </h2>

                    {/* Rating Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 16px",
                        borderRadius: "25px",
                        background: selectedMovie.vote_average >= 7.5 ?
                          "linear-gradient(45deg, #ffd93d, #ffb347)" :
                          selectedMovie.vote_average >= 6.0 ?
                          "linear-gradient(45deg, #74b9ff, #0984e3)" :
                          "linear-gradient(45deg, #fd79a8, #e84393)",
                        color: "#000",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        ⭐ {selectedMovie.vote_average?.toFixed(1)}
                      </div>
                      <span className="content-body" style={{ color: "#b8c5d6", fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
                        {runtime ? `${runtime} min • ` : ''}
                        <img src={calendar} alt="Release date" style={{ width: "25px", height: "25px" }} /> {selectedMovie.release_date?.split("-")[0] || "—"}
                      </span>
                    </div>

                    <p className="content-body" style={{
                      color: "#d1d8e0",
                      lineHeight: "1.7",
                      marginBottom: "24px",
                      fontSize: "1.1rem",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: "400"
                    }}>
                      {selectedMovie.overview || "No overview available."}
                    </p>

                    {selectedMovie.genre_ids?.length > 0 && (
                      <div style={{ marginBottom: "28px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {getGenreNames(selectedMovie.genre_ids).map((g, index) => (
                          <span
                            key={g}
                            className="genre-tag"
                            style={{
                              background: "rgba(255, 217, 61, 0.1)",
                              color: "#ffd93d",
                              border: "1px solid rgba(255, 217, 61, 0.3)",
                              padding: "6px 14px",
                              borderRadius: "18px",
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              animation: `fadeInUp 0.3s ease ${index * 0.1}s both`
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Cast Section */}
                    {cast && (
                      <div style={{ marginBottom: "28px" }}>
                        <h3 className="content-title" style={{
                          fontSize: "1.3rem",
                          marginBottom: "12px",
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: "600"
                        }}><img src={castAndCrew} alt="Cast & Crew" style={{ width: "25px", height: "25px" }} /> Cast & Crew</h3>
                        {castLoading ? (
                          <div className="content-body" style={{ fontFamily: "'Inter', sans-serif" }}>Loading cast...</div>
                        ) : cast.cast?.length > 0 ? (
                          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                            {cast.cast.map((person, index) => {
                              const handlePersonClick = () => {
                                navigate(`/person/${person.id}`);
                              };
                              return (
                                <div key={person.id} onClick={handlePersonClick} style={{
                                  flexShrink: 0,
                                  width: "80px",
                                  textAlign: "center",
                                  animation: `fadeInUp 0.3s ease ${index * 0.1}s both`,
                                  cursor: "pointer",
                                  transition: "transform 0.2s ease"
                                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                                  <img
                                    src={`http://image.tmdb.org/t/p/w185${person.profile_path}`}
                                    alt={person.name}
                                    style={{
                                      width: "60px",
                                      height: "60px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      marginBottom: "6px",
                                      border: "2px solid rgba(255, 217, 61, 0.3)"
                                    }}
                                  />
                                  <div style={{
                                    fontSize: "0.75rem",
                                    color: "#ffd93d",
                                    fontWeight: "600",
                                    fontFamily: "\"Inter\", sans-serif"
                                  }}>
                                    {person.name}
                                  </div>
                                  <div style={{
                                    fontSize: "0.7rem",
                                    color: "#b8c5d6",
                                    fontFamily: "\"Inter\", sans-serif"
                                  }}>
                                    {person.character}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="content-body" style={{
                            color: "#b8c5d6",
                            fontFamily: "'Inter', sans-serif"
                          }}>No cast information available.</div>
                        )}
                      </div>
                    )}

                    {/* Providers section */}
                    <div style={{ marginTop: "12px" }}>
                      <h3 className="content-title" style={{
                          fontSize: "1.3rem",
                          marginBottom: "12px",
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: "600"
                        }}><img src={tv} alt="Where to watch" style={{ width: "25px", height: "25px" }} /> Where to watch</h3>
                      {providersLoading ? (
                        <div className="content-body" style={{ fontFamily: "'Inter', sans-serif" }}>Loading providers...</div>
                      ) : providers ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {['flatrate', 'free', 'ads', 'rent', 'buy'].map((key) => (
                          providers[key]?.length ? (
                            <div key={key}>
                              <div className="content-body" style={{
                                color: "#b8c5d6",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontFamily: "'Inter', sans-serif"
                              }}>
                                {key === 'flatrate' ? (
  <>
    <img src={reel} alt="Streaming" style={{ width: "25px", height: "25px" }} />
    Streaming
  </>
) : key === 'free' ? (
  <>
    <img src={heart} alt="Free" style={{ width: "25px", height: "25px" }} />
    Free
  </>
) : key === 'ads' ? (
  <>
    <img src={tv} alt="With Ads" style={{ width: "25px", height: "25px" }} />
    With Ads
  </>
) : key === 'rent' ? (
  <>
    <img src={buy} alt="Rent" style={{ width: "25px", height: "25px" }} />
    Rent
  </>
) : (
  <>
    <img src={buy} alt="Buy" style={{ width: "25px", height: "25px" }} />
    Buy
  </>
)}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {providers[key].map((p) => (
                                  <div key={p.provider_id} title={p.provider_name} style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    background: "#0f131a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    transition: "transform 0.2s ease",
                                    cursor: "pointer"
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                                  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                  >
                                    {p.logo_path ? (
                                      <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <span style={{
                                        fontSize: "0.7rem",
                                        color: "#b8c5d6",
                                        padding: "4px",
                                        textAlign: "center",
                                        fontFamily: "'Inter', sans-serif"
                                      }}>{p.provider_name}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null
                        ))}
                        {!['flatrate','free','ads','rent','buy'].some((k) => providers[k]?.length) && (
                          <div className="content-body" style={{
                            color: "#b8c5d6",
                            fontFamily: "'Inter', sans-serif"
                          }}>No providers available in your region.</div>
                        )}
                      </div>
                      ) : (
                        <div className="content-body" style={{
                          color: "#b8c5d6",
                          fontFamily: "'Inter', sans-serif"
                        }}>No provider data available.</div>
                      )}
                    </div>

                    {/* Similar Movies Section */}
                    {similarMovies.length > 0 && (
                      <div style={{ marginTop: "24px" }}>
                        <h3 className="content-title" style={{
                          fontSize: "1.3rem",
                          marginBottom: "12px",
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: "600"
                        }}><img src={reel} alt="You may also like" style={{ width: "25px", height: "25px" }} /> You may also like</h3>
                        {similarLoading ? (
                          <div className="content-body" style={{ fontFamily: "'Inter', sans-serif" }}>Loading recommendations...</div>
                        ) : (
                          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                            {similarMovies.map((movie, index) => (
                              <div key={movie.id} style={{
                                flexShrink: 0,
                                width: "120px",
                                cursor: "pointer",
                                animation: `fadeInUp 0.3s ease ${index * 0.1}s both`,
                                transition: "transform 0.2s ease"
                              }}
                              onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                              onClick={() => onSelectMovie(movie)}
                              >
                                <img
                                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                  alt={movie.title}
                                  style={{
                                    width: "100%",
                                    height: "180px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    marginBottom: "6px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                  }}
                                />
                                <div style={{
                                  fontSize: "0.8rem",
                                  color: "#f5f6fa",
                                  fontWeight: "600",
                                  lineHeight: "1.2",
                                  fontFamily: "'Inter', sans-serif"
                                }}>
                                  {movie.title}
                                </div>
                                <div style={{
                                  fontSize: "0.7rem",
                                  color: "#b8c5d6",
                                  fontFamily: "'Inter', sans-serif"
                                }}>
                                  ⭐ {movie.vote_average?.toFixed(1)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  padding: "0 32px 32px",
                  borderTop: "1px solid rgba(255, 217, 61, 0.1)",
                  paddingTop: "24px"
                }}>
                  {/* User Action Buttons */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="btn-secondary"
                      onClick={handleLikeMovie}
                      style={{
                        width: "100px",
                        background: movieLiked ? "rgba(255, 107, 107, 0.3)" : "rgba(255, 107, 107, 0.1)",
                        color: "#ff6b6b",
                        border: "1px solid rgba(255, 107, 107, 0.3)",
                        padding: "16px",
                        borderRadius: "20px",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "'Inter', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255, 107, 107, 0.2)";
                        e.target.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = movieLiked ? "rgba(255, 107, 107, 0.3)" : "rgba(255, 107, 107, 0.1)";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      {movieLiked ? "💖 Liked" : "❤️ Like"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleWatchedMovie}
                      style={{
                        width: "200px",
                        background: movieWatched ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.1)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        padding: "16px",
                        borderRadius: "20px",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "'Inter', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(34, 197, 94, 0.2)";
                        e.target.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = movieWatched ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.1)";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      {movieWatched ? "✅ Watched" : "👁️ Mark as Watched"}
                    </button>
                  </div>

                  {/* Add to Watchlist Button */}
                  <button
                    className="btn-primary"
                    onClick={handleAddToWatchlist}
                    style={{
                      width: "auto",
                      background: movieInWatchlist ? "linear-gradient(45deg, #ff6b6b, #ff8e8e)" : "linear-gradient(45deg, #ffd93d, #ffb347)",
                      color: movieInWatchlist ? "#fff" : "#000",
                      border: "none",
                      padding: "14px 28px",
                      borderRadius: "18px",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.2s ease",
                      boxShadow: movieInWatchlist ? "0 6px 20px rgba(255, 107, 107, 0.3)" : "0 6px 20px rgba(255, 217, 61, 0.3)",
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-3px)";
                      e.target.style.boxShadow = movieInWatchlist ? "0 10px 30px rgba(255, 107, 107, 0.4)" : "0 10px 30px rgba(255, 217, 61, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = movieInWatchlist ? "0 6px 20px rgba(255, 107, 107, 0.3)" : "0 6px 20px rgba(255, 217, 61, 0.3)";
                    }}
                  >
                    {movieInWatchlist ? "❌ Remove from Watchlist" : "➕ Add to Watchlist"}
                  </button>
                </div>
              </div>

              <style>
                {`
                  @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes modalSlideUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px) scale(0.95);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                    }
                  }
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  /* Custom Scrollbar Styles */
                  ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                  }

                  ::-webkit-scrollbar-track {
                    background: rgba(24, 28, 36, 0.3);
                    border-radius: 10px;
                  }

                  ::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, #ffd93d, #ffb347);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                  }

                  ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, #ffb347, #ffd93d);
                    box-shadow: 0 2px 8px rgba(255, 217, 61, 0.3);
                  }

                  ::-webkit-scrollbar-corner {
                    background: rgba(24, 28, 36, 0.3);
                  }

                  /* Firefox scrollbar */
                  * {
                    scrollbar-width: thin;
                    scrollbar-color: #ffd93d rgba(24, 28, 36, 0.3);
                  }
                `}
              </style>
            </div>
          )}
        </>
      ) : (
        <div style={styles.noResults}>
          <h2 className="content-title">No movies found</h2>
          <p className="content-body">Try searching for a different movie or TV show</p>
          <button style={hero.secondaryButton} onClick={() => window.location.reload()}>🔄 Clear Search</button>
        </div>
      )}
    </div>
  );
}

const hero = {
  container: {
    minHeight: "82vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px 120px",
    position: "relative",
    background: `url(${background}) center/cover no-repeat`,
    color: "#f5f6fa",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(24,28,36,0.4) 0%, rgba(24,28,36,0.9) 100%)",
  },
  content: {
    maxWidth: "1200px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "60px",
    position: "relative",
    zIndex: 2,
  },
  textSection: { flex: 1 },
  title: { fontSize: "3.5rem", fontWeight: "bold", marginBottom: "20px", lineHeight: 1.2 },
  highlight: {
    background: "linear-gradient(45deg, #5ee7df 0%, #b490ca 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: { fontSize: "1.3rem", marginBottom: "40px", lineHeight: 1.6 },
  ctaSection: { display: "flex", gap: "20px", marginBottom: "40px"},
  primaryButton: {
    padding: "12px 28px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    borderRadius: "50px",
    cursor: "pointer",
    border: "none",
    background: "linear-gradient(to top, #a8edea 0%, #fed6e3 100%)",
    color: "#181c24",
    boxShadow: "0 8px 25px rgba(255,217,61,0.3)",
    transition: "all 0.3s ease",
  },
  secondaryButton: {
    padding: "12px 28px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    borderRadius: "50px",
    cursor: "pointer",
    border: "2px solid transparent",
    background: "linear-gradient(#181c24, #181c24) padding-box, linear-gradient(to bottom, #a8edea 0%, #fed6e3 100%) border-box",
    color: "#e6edf6",
    transition: "all 0.3s ease",
  },
  features: { display: "flex", gap: "30px" },
  feature: { display: "flex", alignItems: "center", gap: "10px", fontSize: "1rem" },
  featureIcon: { fontSize: "1.5rem" },
  visualSection: { flex: 1, display: "flex", justifyContent: "center", alignItems: "center" },
  movieStack: { position: "relative", width: "300px", height: "400px" },
  movieCard: {
    position: "absolute",
    width: "200px",
    height: "300px",
    background: "linear-gradient(45deg, #232b3b, #333a4d)",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    border: "2px solid #ffd93d",
    overflow: "hidden",
  },
  moviePoster: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "15px",
  },
  fallbackEmoji: {
    position: "absolute",
    fontSize: "4rem",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  movieRating: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.8)",
    color: "#ffd93d",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    backdropFilter: "blur(4px)",
  },
  movieVotes: {
    position: "absolute",
    bottom: "40px",
    left: "10px",
    background: "rgba(0,0,0,0.8)",
    color: "#b8c5d6",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    backdropFilter: "blur(4px)",
  },
  movieTitle: {
    height: "20px",
    width: "100%",
    position: "absolute",
    bottom: "-6px",
    left: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.9)",
    color: "#e6edf6",
    // padding: "6px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    backdropFilter: "blur(4px)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center",
  },
  clickHint: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(0,0,0,0.7)",
    color: "#ffd93d",
    padding: "8px 15px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    backdropFilter: "blur(4px)",
    zIndex: 10,
    opacity: 0.8,
    pointerEvents: "none",
  },
  loadingPlaceholder: {
    fontSize: "4rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
};

const styles = {
  container: { padding: "20px", minHeight: "100vh", background: "linear-gradient(135deg, #181c24 0%, #232b3b 100%)" },
  searchHeader: { textAlign: "center", marginBottom: "30px" },
  searchTitle: { fontSize: "2rem", fontWeight: "bold" , color: "#f5f6fa"},
  resultCount: { fontSize: "1.1rem", color: "#b8c5d6" },
  movieGrid: { display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" },
  noResults: { textAlign: "center", padding: "60px 20px" },
};

export default Content;