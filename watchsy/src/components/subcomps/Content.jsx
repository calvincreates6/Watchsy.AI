import React, { useEffect, useState } from "react";
import Card from "./Card";
import { searchMovies, fetchGenres, fetchPopularTopMovies } from "../../api/tmdb";
import background from "../../assets/movie_bg.jpg";

function Content({ searchQuery }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState({});
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [cardOrder, setCardOrder] = useState([0, 1, 2]); // Track card order
  const [animatingCard, setAnimatingCard] = useState(null); // Track which card is animating

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
        console.log("Hero movies loaded:", topMovies.map(m => ({ 
          title: m.title, 
          rating: m.vote_average, 
          votes: m.vote_count,
          year: m.release_date?.split("-")[0] 
        })));
        setHeroMovies(topMovies);
      } catch (err) {
        console.error("Error fetching hero movies:", err);
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
        setMovies(results);
      } catch (err) {
        console.error(err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [searchQuery]);

  const getGenreNames = (genreIds) =>
    genreIds.map((id) => genres[id]).filter(Boolean);

  // Hero Section
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
              className="btn-primary"
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
              🎬 Start Exploring
            </button>
            <button
              style={hero.secondaryButton}
              className="btn-secondary"
              onMouseEnter={(e) => e.target.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              📝 Create Watchlist
            </button>
          </div>
          <div style={hero.features}>
            <div style={hero.feature} className="accent-text"><span style={hero.featureIcon}>🔍</span> Search & Discover</div>
            <div style={hero.feature} className="accent-text"><span style={hero.featureIcon}>❤️</span> Save Favorites</div>
            <div style={hero.feature} className="accent-text"><span style={hero.featureIcon}>👥</span> Share With Friends</div>
          </div>
        </div>
        <div style={hero.visualSection}>
          <div style={hero.movieStack}>
            {heroLoading ? (
              // Loading state for hero movies
              <>
                <div style={{ ...hero.movieCard, transform: "rotate(-8deg)", animation: "float 3s ease-in-out infinite alternate" }}>
                  <div style={hero.loadingPlaceholder}>🎬</div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(4deg)", animation: "float 3s ease-in-out infinite alternate 0.3s" }}>
                  <div style={hero.loadingPlaceholder}>🎭</div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(-2deg)", animation: "float 3s ease-in-out infinite alternate 0.6s" }}>
                  <div style={hero.loadingPlaceholder}>🎪</div>
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
                      {displayIndex === 0 ? '🎬' : displayIndex === 1 ? '🎭' : '🎪'}
                    </div>
                    <div style={hero.movieRating} className="movie-rating">
                      ⭐ {movie.vote_average.toFixed(1)}
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
                  <div style={hero.loadingPlaceholder}>🎬</div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(4deg)", animation: "float 3s ease-in-out infinite alternate 0.3s" }}>
                  <div style={hero.loadingPlaceholder}>🎭</div>
                </div>
                <div style={{ ...hero.movieCard, transform: "rotate(-2deg)", animation: "float 3s ease-in-out infinite alternate 0.6s" }}>
                  <div style={hero.loadingPlaceholder}>🎪</div>
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
          <div style={styles.movieGrid}>
            {movies.map((movie) => (
              <Card
                key={movie.id}
                title={movie.title}
                poster={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                rating={movie.vote_average}
                year={movie.release_date?.split("-")[0]}
                genres={getGenreNames(movie.genre_ids || [])}
              />
            ))}
          </div>
        </>
      ) : (
        <div style={styles.noResults}>
          <h2 className="content-title">No movies found</h2>
          <p className="content-body">Try searching for a different movie or TV show</p>
          <button style={hero.secondaryButton} className="btn-secondary" onClick={() => window.location.reload()}>🔄 Clear Search</button>
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
  ctaSection: { display: "flex", gap: "20px", marginBottom: "40px" },
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
    position: "absolute",
    bottom: "10px",
    left: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.9)",
    color: "#e6edf6",
    padding: "6px 8px",
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
  container: { padding: "20px" },
  searchHeader: { textAlign: "center", marginBottom: "30px" },
  searchTitle: { fontSize: "2rem", fontWeight: "bold" , color: "#f5f6fa"},
  resultCount: { fontSize: "1.1rem", color: "#b8c5d6" },
  movieGrid: { display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" },
  noResults: { textAlign: "center", padding: "60px 20px" },
};

export default Content;
