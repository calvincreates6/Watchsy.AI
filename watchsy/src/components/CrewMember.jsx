import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails, getMoviesByPerson, fetchWatchProviders, fetchTrailers, fetchCast, fetchSimilarMovies, fetchMovieDetails } from '../api/tmdb';
import { useUserData } from '../hooks/useUserData';
import { useToast } from './ToastProvider';
import { emit, on } from "../events/bus";
import Card from './subcomps/Card';
import posterFiller from "../assets/posterFiller.jpg";
import castAndCrew from "../assets/cast and crew.png";
import buy from "../assets/buy.png";
import tv from "../assets/tv.png";
import star from "../assets/star.png";
import heart from "../assets/heart.png";
import reel from "../assets/video reel.png";
import brokenHeart from "../assets/broken heart.png";
import calendar from "../assets/calendar.png";
import checklist from "../assets/checklist.png";
import Header from './subcomps/Header';
import Footer from './subcomps/Footer';

const CrewMember = () => {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { addMovieToWatchlist, removeMovieFromWatchlist, addMovieToLiked, removeMovieFromLiked, addMovieToWatched, removeMovieFromWatched, isMovieInList } = useUserData();
  const toast = useToast();
  
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [providers, setProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [cast, setCast] = useState(null);
  const [castLoading, setCastLoading] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [runtime, setRuntime] = useState(null);
  const [movieLiked, setMovieLiked] = useState(false);
  const [movieWatched, setMovieWatched] = useState(false);
  const [movieInWatchlist, setMovieInWatchlist] = useState(false);
  const [stickyActive, setStickyActive] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    const loadPersonData = async () => {
      if (!personId) return;
      
      setLoading(true);
      try {
        const [personData, moviesData] = await Promise.all([
          getPersonDetails(personId),
          getMoviesByPerson(personId)
        ]);
        
        setPerson(personData);
        setMovies(moviesData);
      } catch (error) {
        console.error('Error loading person data:', error);
        toast.error('Failed to load crew member data');
      } finally {
        setLoading(false);
      }
    };

    loadPersonData();
  }, [personId, toast]);

  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie);
    
    // Check movie status
    const currentId = movie.id || `${movie.title}-${movie.release_date?.split('-')[0]}`;
    setMovieLiked(isMovieInList(currentId, 'liked'));
    setMovieWatched(isMovieInList(currentId, 'watched'));
    setMovieInWatchlist(isMovieInList(currentId, 'watchlist'));

    // Reset sticky state
    setStickyActive(false);

    // Load additional data
    setProvidersLoading(true);
    setTrailerLoading(true);
    setCastLoading(true);
    setSimilarLoading(true);

    try {
      // Load watch providers
      const providersData = await fetchWatchProviders(movie.id);
      setProviders(providersData);

      // Load trailer
      const trailerData = await fetchTrailers(movie.id);
      setTrailer(trailerData);

      // Load cast
      const castData = await fetchCast(movie.id);
      setCast(castData);

      // Load similar movies
      const similarData = await fetchSimilarMovies(movie.id);
      setSimilarMovies(similarData);

      // Load movie details for runtime
      const movieDetails = await fetchMovieDetails(movie.id);
      if (movieDetails) {
        setRuntime(movieDetails.runtime);
      }
    } catch (error) {
      console.error('Error loading movie data:', error);
    } finally {
      setProvidersLoading(false);
      setTrailerLoading(false);
      setCastLoading(false);
      setSimilarLoading(false);
    }

    setShowOverlay(true);
  };

  const handleMovieAction = (action, movie) => {
    const currentId = movie.id || `${movie.title}-${movie.release_date?.split('-')[0]}`;
    
    const movieData = {
      id: currentId,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      rating: movie.vote_average,
      year: movie.release_date?.split('-')[0],
      genres: []
    };
    
    switch (action) {
      case 'like':
        if (movieLiked) {
          removeMovieFromLiked(currentId);
          setMovieLiked(false);
          emit('movie:liked', { movieId: currentId, liked: false });
          toast.info("Removed from liked movies");
        } else {
          addMovieToLiked(movieData);
          setMovieLiked(true);
          emit('movie:liked', { movieId: currentId, liked: true });
          toast.info("Added to liked movies");
        }
        break;
      case 'watchlist':
        if (movieInWatchlist) {
          removeMovieFromWatchlist(currentId);
          setMovieInWatchlist(false);
          emit('movie:watchlist', { movieId: currentId, inWatchlist: false });
          toast.info("Removed from watchlist");
        } else {
          addMovieToWatchlist(movieData);
          setMovieInWatchlist(true);
          emit('movie:watchlist', { movieId: currentId, inWatchlist: true });
          toast.info("Added to watchlist");
        }
        break;
      case 'watched':
        if (movieWatched) {
          removeMovieFromWatched(currentId);
          setMovieWatched(false);
          emit('movie:watched', { movieId: currentId, watched: false });
          toast.info("Removed from watched list");
        } else {
          addMovieToWatched(movieData);
          setMovieWatched(true);
          emit('movie:watched', { movieId: currentId, watched: true });
          toast.info("Added to watched list");
        }
        break;
    }
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setSelectedMovie(null);
    setProviders(null);
    setTrailer(null);
    setCast(null);
    setSimilarMovies([]);
    setRuntime(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading crew member...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!person) {
    return (
      <div style={styles.container}>
        <Header />
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Crew Member Not Found</h2>
          <p style={styles.errorText}>The requested crew member could not be found.</p>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      
      {/* Person Header */}
      <div style={styles.personHeader}>
        <div style={styles.personInfo}>
          <div style={styles.profileImageContainer}>
            {person.profile_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} 
                alt={person.name}
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.profilePlaceholder}>
                <span style={styles.profilePlaceholderText}>
                  {person.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
          </div>
          
          <div style={styles.personDetails}>
            <h1 style={styles.personName}>{person.name}</h1>
            {person.known_for_department && (
              <p style={styles.department}>{person.known_for_department}</p>
            )}
            {person.biography && (
              <div style={styles.biography}>
                <h3 style={styles.biographyTitle}>Biography</h3>
                <p style={styles.biographyText}>
                  {person.biography.length > 500 
                    ? `${person.biography.substring(0, 500)}...` 
                    : person.biography
                  }
                </p>
              </div>
            )}
            {person.birthday && (
              <p style={styles.birthday}>
                Born: {new Date(person.birthday).toLocaleDateString()}
                {person.place_of_birth && ` in ${person.place_of_birth}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div style={styles.moviesSection}>
        <h2 style={styles.sectionTitle}>
          Filmography ({movies.length} movies)
        </h2>
        
        {movies.length > 0 ? (
          <div style={styles.moviesGrid}>
            {movies.map((movie) => (
              <Card
                key={movie.id}
                id={movie.id}
                title={movie.title}
                poster={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : posterFiller}
                rating={movie.vote_average}
                year={movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                genres={[]} // We don't have genres in this context
                onSelect={() => handleMovieSelect(movie)}
              />
            ))}
          </div>
        ) : (
          <div style={styles.noMovies}>
            <p style={styles.noMoviesText}>No movies found for this person.</p>
          </div>
        )}
      </div>

      {/* Movie Overlay Modal (mirrors AI page overlay) */}
      {showOverlay && selectedMovie && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeOverlay}
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
            overflow: 'hidden'
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
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeOverlay}
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
              ‚úï
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
              const threshold = 120;
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
                    ‚≠ê {selectedMovie.vote_average?.toFixed(1)}
                  </div>
                  <span className="content-body" style={{ color: "#b8c5d6", fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
                    {runtime ? `${runtime} min ‚Ä¢ ` : ''}
                    <img src={calendar} alt="Release date" style={{ width: "25px", height: "25px" }} /> {selectedMovie.release_date?.split("-")[0] || "‚Äî"}
                  </span>
                </div>

                {/* Movie Summary/Overview - ALWAYS SHOW */}
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{
                    fontSize: "1.3rem",
                    marginBottom: "12px",
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: "600",
                    color: "#ffffff"
                  }}>Summary</h3>
                  <p style={{ 
                    fontSize: '1rem', 
                    lineHeight: '1.6', 
                    color: '#b8c5d6',
                    fontFamily: "'Inter', sans-serif",
                    margin: 0
                  }}>
                    {selectedMovie.overview || "No summary available for this movie."}
                  </p>
                </div>

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
                                src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
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
                                fontFamily: "'Inter', sans-serif"
                              }}>
                                {person.name}
                              </div>
                              <div style={{
                                fontSize: "0.7rem",
                                color: "#b8c5d6",
                                fontFamily: "'Inter', sans-serif"
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
                              <> <img src={reel} alt="Streaming" style={{ width: "25px", height: "25px" }} /> Streaming </>
                            ) : key === 'free' ? (
                              <> <img src={brokenHeart} alt="Free" style={{ width: "25px", height: "25px" }} /> Free </>
                            ) : key === 'ads' ? (
                              <> <img src={tv} alt="With Ads" style={{ width: "25px", height: "25px" }} /> With Ads </>
                            ) : key === 'rent' ? (
                              <> <img src={buy} alt="Rent" style={{ width: "25px", height: "25px" }} /> Rent </>
                            ) : (
                              <> <img src={buy} alt="Buy" style={{ width: "25px", height: "25px" }} /> Buy </>
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
                          onClick={() => handleMovieSelect(movie)}
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
                              ‚≠ê {movie.vote_average?.toFixed(1)}
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
                  onClick={() => handleMovieAction('like', selectedMovie)}
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
                  {movieLiked ? "Ì≤ñ Liked" : "‚ù§Ô∏è Like"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleMovieAction('watched', selectedMovie)}
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
                  {movieWatched ? "‚úÖ Watched" : "Ì±ÅÔ∏è Mark as Watched"}
                </button>
              </div>

              {/* Add to Watchlist Button */}
              <button
                className="btn-primary"
                onClick={() => handleMovieAction('watchlist', selectedMovie)}
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
                {movieInWatchlist ? "‚ùå Remove from Watchlist" : "‚ûï Add to Watchlist"}
              </button>
            </div>

            <style>
              {`
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                /* Custom Scrollbar Styles (overlay) */
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
                * {
                  scrollbar-width: thin;
                  scrollbar-color: #ffd93d rgba(24, 28, 36, 0.3);
                }
              `}
            </style>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%)',
    color: '#ffffff'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '20px'
  },
  
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.1)',
    borderTop: '4px solid #d53369',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  
  loadingText: {
    fontSize: '18px',
    color: '#b8c5d6'
  },
  
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '20px',
    textAlign: 'center'
  },
  
  errorTitle: {
    fontSize: '24px',
    color: '#ff6b6b',
    margin: 0
  },
  
  errorText: {
    fontSize: '16px',
    color: '#b8c5d6',
    margin: 0
  },
  
  backButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #d53369, #daae51)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  
  personHeader: {
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  personInfo: {
    display: 'flex',
    gap: '30px',
    alignItems: 'flex-start'
  },
  
  profileImageContainer: {
    flexShrink: 0
  },
  
  profileImage: {
    width: '200px',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  
  profilePlaceholder: {
    width: '200px',
    height: '300px',
    background: 'linear-gradient(135deg, #d53369, #daae51)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  },
  
  profilePlaceholderText: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffffff'
  },
  
  personDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  personName: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(135deg, #d53369, #daae51)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  
  department: {
    fontSize: '18px',
    color: '#b8c5d6',
    margin: 0,
    fontWeight: '500'
  },
  
  biography: {
    marginTop: '10px'
  },
  
  biographyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 10px 0',
    color: '#ffffff'
  },
  
  biographyText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#b8c5d6',
    margin: 0
  },
  
  birthday: {
    fontSize: '16px',
    color: '#b8c5d6',
    margin: 0
  },
  
  moviesSection: {
    padding: '0 20px 40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 30px 0',
    color: '#ffffff'
  },
  
  moviesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  
  noMovies: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  
  noMoviesText: {
    fontSize: '18px',
    color: '#b8c5d6'
  }
};

export default CrewMember;
