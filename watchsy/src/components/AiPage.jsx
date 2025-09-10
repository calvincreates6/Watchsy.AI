import React, { useEffect, useState, useRef } from "react";
import Card from "./subcomps/Card";
import { fetchGenres, fetchPopularTopMovies, fetchWatchProviders, fetchTrailers, fetchCast, fetchSimilarMovies, searchMovies, fetchMovieDetails } from "../api/tmdb";
import background from "../assets/movie_bg.jpg";
import castAndCrew from "../assets/cast and crew.png";
import buy from "../assets/buy.png";
import tv from "../assets/tv.png";
import reel from "../assets/video reel.png";
import brokenHeart from "../assets/broken heart.png";
import calendar from "../assets/calendar.png";
import { useUserData } from "../hooks/useUserData";
import { useToast } from "./ToastProvider";
import { emit, on } from "../events/bus";
import AdSlot from "./ads/AdSlot";
import posterFiller from "../assets/posterFiller.jpg";
import { askOpenAI } from "../api/OpenAi";
import Header from "./subcomps/Header";
import Footer from "./subcomps/Footer"; 
import AI from "./subcomps/AI";

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
  const [runtime, setRuntime] = useState(null);
  // For Load More pagination
  const [aiTitles, setAiTitles] = useState([]);
  const [aiTitleIndex, setAiTitleIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Generate recommendations only once per user session
  const hasGeneratedRef = useRef(false);

  // Movie status states for overlay buttons
  const [movieLiked, setMovieLiked] = useState(false);
  const [movieWatched, setMovieWatched] = useState(false);
  const [movieInWatchlist, setMovieInWatchlist] = useState(false);

  // Sticky poster and scroll area ref for overlay like in Content
  const [stickyActive, setStickyActive] = useState(false);
  const scrollAreaRef = useRef(null);

  const {
    user,
    isLoading,
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
      .slice(0, 100);
  }

  // Load genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreData = await fetchGenres();
        const genreMap = {};
        (genreData || []).forEach(g => { if (g && g.id != null) genreMap[g.id] = g.name; });
        setGenres(genreMap);
      } catch (error) {
        console.error("Error loading genres:", error);
      }
    };
    loadGenres();
  }, []);

  // Reset generation guard when user changes
  useEffect(() => { hasGeneratedRef.current = false; }, [user]);

  // Generate when liked list has loaded and has items; if empty after load, show fallback but allow future regen when likes appear
  useEffect(() => {
    if (!user) return;
    if (hasGeneratedRef.current) return;
    if (isLoading) return;
    if ((likedList || []).length > 0) {
      hasGeneratedRef.current = true;
      generateRecommendations();
    } else {
      // Show fallback (popular) without locking generation; will regenerate when likes appear
      (async () => {
        try {
          const popularMovies = await fetchPopularTopMovies();
          setRecommendedMovies(popularMovies.slice(0, 20));
          setRecommendationReason('Trending picks while we learn your taste');
        } catch (_) {}
      })();
    }
  }, [user, isLoading, likedList]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Prompt: use only liked movies
      const likedTitles = likedList.slice(0, 15).map(m => m.title).filter(Boolean);
      const likedSample = likedList.slice(0, 10);

      // Learn patterns from liked movies
      const genreNames = (ids) => (ids || []).map(id => genres[id]).filter(Boolean);
      const genreFreq = new Map();
      likedSample.forEach(m => {
        for (const g of genreNames(m.genre_ids || [])) {
          genreFreq.set(g, (genreFreq.get(g) || 0) + 1);
        }
      });
      const topGenres = Array.from(genreFreq.entries()).sort((a,b) => b[1]-a[1]).slice(0,5).map(([g]) => g);

      // Fetch crew and providers for a small sample (parallel)
      const details = await Promise.all(likedSample.map(async (m) => {
        try {
          const [castData, providersData] = await Promise.all([
            fetchCast(m.id),
            fetchWatchProviders(m.id, 'US').catch(()=>({}))
          ]);
          const topCast = (castData?.cast || []).slice(0,3).map(p => p.name).filter(Boolean);
          const director = castData?.director?.name ? [castData.director.name] : [];
          const providerNames = [];
          for (const key of ['flatrate','free','ads','rent','buy']){
            if (Array.isArray(providersData?.[key])) providerNames.push(...providersData[key].map(p=>p.provider_name).filter(Boolean));
          }
          return { cast:[...director, ...topCast], providers: providerNames };
        } catch(_) { return { cast:[], providers:[] }; }
      }));

      const castFreq = new Map();
      const providerFreq = new Map();
      for (const d of details){
        for (const name of d.cast){ castFreq.set(name, (castFreq.get(name)||0)+1); }
        for (const p of d.providers){ providerFreq.set(p, (providerFreq.get(p)||0)+1); }
      }
      const topCrew = Array.from(castFreq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n])=>n);
      const topProviders = Array.from(providerFreq.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n])=>n);

      const prompt = `User liked these movies: ${likedTitles.join(', ')}.

Learn from patterns in their taste:
- Frequent genres: ${topGenres.join(', ') || 'N/A'}
- Frequent directors/actors: ${topCrew.join(', ') || 'N/A'}
- Common streaming availability: ${topProviders.join(', ') || 'N/A'}

Recommend up to 100 movies they may also like, prioritizing matches to these patterns while adding some variety. Avoid duplicates and titles the user already liked. Output ONLY movie titles, one per line.`;

      const aiResponse = await askOpenAI(prompt, {
        temperature: 0.7,
        system: 'You are a movie recommendation expert. Use ONLY the provided liked movies to infer taste. Return ONLY movie titles, one per line.'
      });

      // Show a friendly reason text rather than raw AI list
      if (likedTitles.length > 0) {
        setRecommendationReason(`Because you liked: ${likedTitles.join(', ')}`);
      } else {
        setRecommendationReason('Recommendations based on your liked movies');
      }

      // Parse AI titles and search TMDB to render cards
      const titles = parseAiTitles(aiResponse);
      setAiTitles(titles);
      setAiTitleIndex(0);
      setRecommendedMovies([]);
      // Load first chunk
      await loadMoreRecommendations(titles, 20);
      if (recommendedMovies.length === 0 && titles.length === 0) {
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

  // Load more helper
  const loadMoreRecommendations = async (allTitles = aiTitles, chunkSize = 20) => {
    if (!allTitles || aiTitleIndex >= allTitles.length) return;
    setLoadingMore(true);
    const start = aiTitleIndex;
    const end = Math.min(allTitles.length, start + chunkSize);
    const subset = allTitles.slice(start, end);
    let found = [];
    for (const title of subset) {
      try {
        const results = await searchMovies(title);
        const best = chooseBestResult(results, title);
        if (best) found.push(best);
      } catch (_) {}
    }
    // Dedupe with existing
    const seen = new Set((recommendedMovies || []).map(m => m.id));
    const next = [...recommendedMovies];
    for (const m of found) {
      if (m && !seen.has(m.id)) { seen.add(m.id); next.push(m); }
    }
    setRecommendedMovies(next);
    setAiTitleIndex(end);
    setLoadingMore(false);
  };

  // Handle movie selection for overlay
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
      setSimilarMovies(similarData.slice(0, 6));

      // Load details for runtime
      try {
        const details = await fetchMovieDetails(movie.id);
        setRuntime(details?.runtime || null);
      } catch(_) { setRuntime(null); }
    } catch (error) {
      console.error("Error loading movie details:", error);
    } finally {
      setProvidersLoading(false);
      setTrailerLoading(false);
      setCastLoading(false);
      setSimilarLoading(false);
    }
  };

  // Sync overlay when Card emits events
  useEffect(() => {
    const onLiked = (e) => {
      const { movieId, liked } = e.detail || {};
      if (selectedMovie && String(selectedMovie.id) === String(movieId)) setMovieLiked(!!liked);
    };
    const onWatchlist = (e) => {
      const { movieId, inWatchlist } = e.detail || {};
      if (selectedMovie && String(selectedMovie.id) === String(movieId)) setMovieInWatchlist(!!inWatchlist);
    };
    const off1 = on('movie:liked', onLiked);
    const off2 = on('movie:watchlist', onWatchlist);
    return () => { off1(); off2(); };
  }, [selectedMovie]);

  // Lock body scroll when overlay is open to prevent dual scrollbars
  useEffect(() => {
    if (selectedMovie) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [selectedMovie]);

  // Handle movie actions
  const handleMovieAction = (action, movie) => {
    const currentId = movie.id || `${movie.title}-${movie.release_date?.split('-')[0]}`;
    
    const movieData = {
      id: currentId,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      rating: movie.vote_average,
      year: movie.release_date?.split('-')[0],
      genres: movie.genre_ids ? movie.genre_ids.map(id => genres[id]).filter(Boolean) : []
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

  // Close overlay
  const closeOverlay = () => {
    setSelectedMovie(null);
    setProviders(null);
    setTrailer(null);
    setCast(null);
    setSimilarMovies([]);
    setRuntime(null);
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
        padding: '15px',
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
        {/* Toggle center like Watchlist */}
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Discover your next favorite movie based on your watch history and preferences
        </p>
      </div>

      {/* Recommendations Section */}
      <div id="recommendations" className="recommendations-section" style={{ padding: '40px 20px' }}>
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
          {/* Ad Slot */}
          <div style={{ margin: '40px 0', height: '100px', width: '100%'}}>
            <AdSlot width={100} height={150} />
          </div>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap: '14px', margin:'8px 0 20px' }}>
            <a href="#recommendations" style={{
              textDecoration:'none',
              background:'linear-gradient(45deg, #ffd93d, #ffb347)',
              color:'#181c24',
              padding:'14px 26px',
              borderRadius:'28px',
              fontWeight:700,
              boxShadow:'0 8px 24px rgba(255,217,61,0.25)',
              border:'1px solid rgba(0,0,0,0.08)'
            }}>Recommendations</a>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              gap:'10px',
              background:'linear-gradient(90deg,rgba(255, 0, 230, 0.75) 0%, rgba(0, 0, 255, 0.75) 65%, rgba(0, 212, 255, 0.75) 100%)',
              border:'1px solid rgba(255,255,255,0.15)',
              color:'#eaeaea',
              padding:'8px 24px',
              borderRadius:'28px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.25)'
            }}>
              <span style={{ fontWeight:700 }}>Talk to AI</span>
              <AI />
            </div>
          </div>
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
                    id={movie.id}
                    title={movie.title}
                    poster={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : posterFiller}
                    rating={movie.vote_average}
                    year={movie.release_date?.split('-')[0]}
                    genres={movie.genre_ids ? movie.genre_ids.map(id => genres[id]).filter(Boolean) : []}
                    onSelect={() => handleMovieSelect(movie)}
                  />
                </div>
              ))}
              {aiTitleIndex < aiTitles.length && (
                <div style={{ gridColumn: '1 / -1', display:'flex', justifyContent:'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => loadMoreRecommendations()}
                    disabled={loadingMore}
                    style={{
                      padding:'12px 22px',
                      borderRadius: 24,
                      border:'none',
                      background:'linear-gradient(45deg, #ffd93d, #ffb347)',
                      color:'#181c24',
                      fontWeight:700,
                      cursor:'pointer',
                      boxShadow:'0 8px 24px rgba(255,217,61,0.25)'
                    }}
                  >
                    {loadingMore ? 'Loading…' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Talk to AI Section */}
      {/* <div id="talk-ai" style={{ padding: '20px 20px 60px' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', display:'flex', justifyContent:'center' }}>
          
        </div>
      </div> */}

      {/* Movie Overlay Modal (mirrors Content overlay) */}
      {selectedMovie && (
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
                    ⭐ {selectedMovie.vote_average?.toFixed(1)}
                  </div>
                  <span className="content-body" style={{ color: "#b8c5d6", fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
                    {runtime ? `${runtime} min • ` : ''}
                    <img src={calendar} alt="Release date" style={{ width: "25px", height: "25px" }} /> {selectedMovie.release_date?.split("-")[0] || "—"}
                  </span>
                </div>

                <div style={{ color:'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  {runtime ? `${runtime} min • ` : ''}{selectedMovie.release_date?.split('-')[0]}
                </div>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>{selectedMovie.overview}</p>

                {selectedMovie.genre_ids?.length > 0 && (
                  <div style={{ marginBottom: "28px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {selectedMovie.genre_ids.map((id, index) => (
                      genres[id] ? (
                        <span
                          key={id}
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
                          {genres[id]}
                        </span>
                      ) : null
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
                        {cast.cast.map((person, index) => (
                          <div key={person.id} style={{
                            flexShrink: 0,
                            width: "80px",
                            textAlign: "center",
                            animation: `fadeInUp 0.3s ease ${index * 0.1}s both`
                          }}>
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
                        ))}
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
                  {movieLiked ? "💖 Liked" : "❤️ Like"}
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
                  {movieWatched ? "✅ Watched" : "👁️ Mark as Watched"}
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
                {movieInWatchlist ? "❌ Remove from Watchlist" : "➕ Add to Watchlist"}
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
}

export default AiPage;
