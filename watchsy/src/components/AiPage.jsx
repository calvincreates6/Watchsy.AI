import React, { useEffect, useState, useRef } from "react";
import Card from "./subcomps/Card";
import { fetchGenres, fetchPopularTopMovies, fetchWatchProviders, fetchTrailers, fetchCast, fetchSimilarMovies, searchMovies } from "../api/tmdb";
import background from "../assets/movie_bg.jpg";
import movieClapperboard from "../assets/movie clapperboard.png";
import castAndCrew from "../assets/cast and crew.png";
import buy from "../assets/buy.png";
import tv from "../assets/tv.png";
import star from "../assets/star.png";
import heart from "../assets/heart.png";
import reel from "../assets/video reel.png";
import brokenHeart from "../assets/broken heart.png";
import calendar from "../assets/calendar.png";
import search from "../assets/search.png";
import videoReel from "../assets/video reel.png";
import camera from "../assets/camera.png";
import checklist from "../assets/checklist.png";
import { useUserData } from "../hooks/useUserData";
import { useToast } from "./ToastProvider";
import { emit, on } from "../events/bus";
import AdSlot from "./ads/AdSlot";
import posterFiller from "../assets/posterFiller.jpg";
import { askOpenAI } from "../api/OpenAi";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer"; 

function AiPage() {
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState({});
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [providers, setProviders] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [cast, setCast] = useState(null);
  const [castLoading, setCastLoading] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [recommendationReason, setRecommendationReason] = useState("");

  // Movie status states for overlay buttons
  const [movieLiked, setMovieLiked] = useState(false);
  const [movieWatched, setMovieWatched] = useState(false);
  const [movieInWatchlist, setMovieInWatchlist] = useState(false);

  const {
    user,
    watchlist,
    watchedList,
    likedList,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addMovieToLiked,
    removeMovieFromLiked,
    addMovieToWatched,
    removeMovieFromWatched,
    isMovieInList,
  } = useUserData();

  const toast = useToast();

  // Helpers: parse AI text into titles and choose best TMDB result
  function normalizeTitle(t){
    return String(t||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function chooseBestResult(results, target){
    const nt = normalizeTitle(target);
    let best = null; let bestScore = -1;
    for(const r of (results||[])){
      const rt = normalizeTitle(r.title || r.name || '');
      let score = 0;
      if(rt === nt) score += 100;
      else if(rt.startsWith(nt) || nt.startsWith(rt)) score += 60;
      score += (r.popularity||0)*0.01 + (r.vote_count||0)*0.001 + (r.vote_average||0);
      if(r.poster_path) score += 5;
      if(score > bestScore){ bestScore = score; best = r; }
    }
    return best;
  }
  function parseAiTitles(text){
    return String(text||'')
      .split(/\r?\n+/)
      .map(l => l.replace(/^[-*•\d]+[\.)\s]+/, '').replace(/\s*\(\d{4}\).*/, '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  // Load genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreData = await fetchGenres();
        setGenres(genreData);
      } catch (error) {
        console.error("Error loading genres:", error);
      }
    };
    loadGenres();
  }, []);

  // Generate AI recommendations based on user's watch history
  useEffect(() => {
    if (user && (watchedList.length > 0 || likedList.length > 0)) {
      generateRecommendations();
    }
  }, [user, watchedList, likedList]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Create a prompt based on user's preferences
      const userPreferences = {
        watched: watchedList.slice(0, 10).map(m => m.title),
        liked: likedList.slice(0, 10).map(m => m.title),
        watchlist: watchlist.slice(0, 10).map(m => m.title)
      };

      const prompt = `Based on these user preferences, recommend 20 diverse movies:
      
Watched: ${userPreferences.watched.join(', ')}
Liked: ${userPreferences.liked.join(', ')}
Watchlist: ${userPreferences.watchlist.join(', ')}

Please recommend movies that are:
1. Similar to their liked movies
2. Different genres they haven't explored much
3. Popular/well-rated movies they might have missed
4. Recent releases (2020-2024)

Format your response as a simple list of movie titles, one per line.`;

      const aiResponse = await askOpenAI(prompt, {
        temperature: 0.7,
        system: 'You are a movie recommendation expert. Provide only movie titles, one per line, based on user preferences.'
      });

      setRecommendationReason(aiResponse);

      // Parse AI titles and search TMDB to render cards
      const titles = parseAiTitles(aiResponse);
      let found = [];
      for(const title of titles){
        try {
          const results = await searchMovies(title);
          const best = chooseBestResult(results, title);
          if(best) found.push(best);
        } catch(_e) {}
      }
      // Dedupe by TMDB id
      const unique = [];
      const seen = new Set();
      for(const m of found){ if(m && !seen.has(m.id)){ seen.add(m.id); unique.push(m);} }
      if(unique.length > 0){
        setRecommendedMovies(unique.slice(0, 20));
      } else {
        // Fallback to popular movies
        const popularMovies = await fetchPopularTopMovies();
        setRecommendedMovies(popularMovies.slice(0, 20));
      }

    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback to popular movies
      try {
        const popularMovies = await fetchPopularTopMovies();
        setRecommendedMovies(popularMovies.slice(0, 20));
      } catch (fallbackError) {
        console.error("Error loading fallback movies:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle movie selection for overlay
  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie);
    
    // Check movie status
    const currentId = movie.id || `${movie.title}-${movie.release_date?.split('-')[0]}`;
    setMovieLiked(isMovieInList(currentId, 'liked'));
    setMovieWatched(isMovieInList(currentId, 'watched'));
    setMovieInWatchlist(isMovieInList(currentId, 'watchlist'));

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
      setSimilarMovies(similarData.slice(0, 6));
    } catch (error) {
      console.error("Error loading movie details:", error);
    } finally {
      setProvidersLoading(false);
      setTrailerLoading(false);
      setCastLoading(false);
      setSimilarLoading(false);
    }
  };

  // Handle movie actions
  const handleMovieAction = (action, movie) => {
    const currentId = movie.id || `${movie.title}-${movie.release_date?.split('-')[0]}`;
    
    switch (action) {
      case 'like':
        if (movieLiked) {
          removeMovieFromLiked(currentId);
          setMovieLiked(false);
          toast("Removed from liked movies");
        } else {
          addMovieToLiked(currentId, movie);
          setMovieLiked(true);
          toast("Added to liked movies");
        }
        break;
      case 'watchlist':
        if (movieInWatchlist) {
          removeMovieFromWatchlist(currentId);
          setMovieInWatchlist(false);
          toast("Removed from watchlist");
        } else {
          addMovieToWatchlist(currentId, movie);
          setMovieInWatchlist(true);
          toast("Added to watchlist");
        }
        break;
      case 'watched':
        if (movieWatched) {
          removeMovieFromWatched(currentId);
          setMovieWatched(false);
          toast("Removed from watched list");
        } else {
          addMovieToWatched(currentId, movie);
          setMovieWatched(true);
          toast("Added to watched list");
        }
        break;
    }
  };

  // Close overlay
  const closeOverlay = () => {
    setSelectedMovie(null);
    setProviders(null);
    setTrailer(null);
    setCast(null);
    setSimilarMovies([]);
  };

  return (
    <div className="ai-page" style={{ 
      minHeight: '100vh', 
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header Section */}
      <Header />
      <div className="ai-header" style={{
        padding: '60px 20px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255,0,136,0.1) 0%, rgba(0,179,255,0.1) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #ff0088 0%, #00b3ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          AI Recommendations
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Discover your next favorite movie based on your watch history and preferences
        </p>
        {recommendationReason && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: '800px',
            margin: '20px auto 0'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {recommendationReason}
            </p>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="recommendations-section" style={{ padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' , direction: 'row', display: 'flex'}}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '30px',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            Recommended for You
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading recommendations...</span>
              </div>
              <p style={{ color: 'white', marginTop: '20px' }}>Analyzing your preferences...</p>
            </div>
          ) : (
            <div className="movies-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)', // exactly 4 equal columns
                gap: '30px',
                padding: '20px 0',
            }}>
              {recommendedMovies.map((movie, index) => (
                <div key={movie.id || index} style={{ position: 'relative' }}>
                  <Card
                    {...movie}
                    rating={movie.vote_average}
                    onClick={() => handleMovieSelect(movie)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ad Slot */}
          <div style={{ margin: '40px 0' }}>
            <AdSlot />
          </div>
        </div>
      </div>

      {/* Movie Overlay Modal */}
      {selectedMovie && (
        <div className="movie-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div className="overlay-content" style={{
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}>
            {/* Close Button */}
            <button
              onClick={closeOverlay}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            {/* Movie Header */}
            <div className="movie-header" style={{
              display: 'flex',
              padding: '40px',
              gap: '30px',
              alignItems: 'flex-start'
            }}>
              <img
                src={selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : posterFiller}
                alt={selectedMovie.title}
                style={{
                  width: '300px',
                  height: '450px',
                  objectFit: 'cover',
                  borderRadius: '15px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              />
              <div className="movie-info" style={{ flex: 1, color: 'white' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: 'bold' }}>
                  {selectedMovie.title}
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
                  {selectedMovie.release_date?.split('-')[0]} • {selectedMovie.runtime} min
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <img src={star} alt="Rating" style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {selectedMovie.vote_average?.toFixed(1)}/10
                  </span>
                </div>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>
                  {selectedMovie.overview}
                </p>

                {/* Action Buttons */}
                <div className="action-buttons" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleMovieAction('like', selectedMovie)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '25px',
                      border: 'none',
                      background: movieLiked ? 'linear-gradient(135deg, #ff0088 0%, #ff4081 100%)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <img src={movieLiked ? heart : brokenHeart} alt="Like" style={{ width: '20px', height: '20px' }} />
                    {movieLiked ? 'Liked' : 'Like'}
                  </button>
                  <button
                    onClick={() => handleMovieAction('watchlist', selectedMovie)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '25px',
                      border: 'none',
                      background: movieInWatchlist ? 'linear-gradient(135deg, #00b3ff 0%, #40c4ff 100%)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <img src={checklist} alt="Watchlist" style={{ width: '20px', height: '20px' }} />
                    {movieInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                  <button
                    onClick={() => handleMovieAction('watched', selectedMovie)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '25px',
                      border: 'none',
                      background: movieWatched ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <img src={movieClapperboard} alt="Watched" style={{ width: '20px', height: '20px' }} />
                    {movieWatched ? 'Watched' : 'Mark as Watched'}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Content Tabs */}
            <div className="movie-tabs" style={{
              padding: '0 40px 40px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* Similar Movies */}
              {similarMovies.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '20px' }}>
                    Similar Movies
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '20px'
                  }}>
                    {similarMovies.map((movie, index) => (
                      <div
                        key={movie.id || index}
                        onClick={() => handleMovieSelect(movie)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : posterFiller}
                          alt={movie.title}
                          style={{
                            width: '100%',
                            height: '225px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            transition: 'transform 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                        <p style={{ color: 'white', fontSize: '0.9rem', marginTop: '8px', textAlign: 'center' }}>
                          {movie.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default AiPage;
