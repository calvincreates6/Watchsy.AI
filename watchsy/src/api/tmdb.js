// src/api/tmdb.js
const API_KEY = '8673024fa7d8ce1503e7babaf5656789';  // Replace this with your actual key
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMovies(query) {
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data = await res.json();
  return data.results;
}

export async function fetchGenres() {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    if (!res.ok) throw new Error("Failed to fetch genres");
    const data = await res.json();
    return data.genres; // [{ id: 28, name: 'Action' }, ...]
  }

// Fetch watch providers for a movie by TMDB ID
export async function fetchWatchProviders(movieId, region = 'US') {
  const res = await fetch(`${BASE_URL}/movie/${movieId}/watch/providers?api_key=${API_KEY}`);
  if (!res.ok) throw new Error('Failed to fetch watch providers');
  const data = await res.json();
  const results = data.results || {};
  // Return region-specific providers or an empty object
  return results[region] || {};
}

// Fetch YouTube trailers for a movie by TMDB ID
export async function fetchTrailers(movieId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch trailers');
    const data = await res.json();
    
    // Filter for YouTube trailers, prioritize official ones
    const trailers = data.results.filter(v => 
      v.site === 'YouTube' && 
      v.type === 'Trailer'
    );
    
    // Sort by official first, then by name containing "Official"
    trailers.sort((a, b) => {
      if (a.official && !b.official) return -1;
      if (!a.official && b.official) return 1;
      if (a.name.toLowerCase().includes('official') && !b.name.toLowerCase().includes('official')) return -1;
      if (!a.name.toLowerCase().includes('official') && b.name.toLowerCase().includes('official')) return 1;
      return 0;
    });
    
    return trailers[0] || null; // Return best trailer or null
  } catch (error) {
    console.error('Error fetching trailers:', error);
    return null;
  }
}

// Fetch cast and crew for a movie by TMDB ID
export async function fetchCast(movieId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch cast');
    const data = await res.json();
    
    // Get top 6 cast members (main actors)
    const topCast = data.cast
      .filter(person => person.profile_path) // Only those with photos
      .slice(0, 6)
      .map(person => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profile_path: person.profile_path,
        order: person.order
      }));
    
    // Get director and key crew
    const director = data.crew.find(person => person.job === 'Director');
    const producer = data.crew.find(person => person.job === 'Producer');
    
    return {
      cast: topCast,
      director: director ? { name: director.name, profile_path: director.profile_path } : null,
      producer: producer ? { name: producer.name, profile_path: producer.profile_path } : null
    };
  } catch (error) {
    console.error('Error fetching cast:', error);
    return { cast: [], director: null, producer: null };
  }
}

// Fetch similar movies for recommendations
export async function fetchSimilarMovies(movieId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&page=1`);
    if (!res.ok) throw new Error('Failed to fetch similar movies');
    const data = await res.json();
    
    // Return top 3 similar movies with posters
    return data.results
      .filter(movie => movie.poster_path && movie.vote_average > 0)
      .slice(0, 3)
      .map(movie => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date
      }));
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    return [];
  }
}

// Fetch detailed information for a movie (runtime, etc.)
export async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch movie details');
    return await res.json();
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
}

export async function fetchTopMovies2025() {
  try {
    // First, try to get well-known movies from 2025 with rating >= 7.5 and significant vote count
    const discoverRes = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2025&sort_by=vote_average.desc&vote_average.gte=7.5&vote_count.gte=100&include_adult=false&include_video=false&page=1`
    );
    
    if (!discoverRes.ok) throw new Error("Failed to fetch 2025 movies");
    const discoverData = await discoverRes.json();
    
    // Filter for well-known movies (high rating + significant votes + has poster)
    let topMovies = discoverData.results
      .filter(movie => 
        movie.vote_average >= 7.5 && 
        movie.vote_count >= 100 && 
        movie.poster_path &&
        movie.popularity > 10 // Ensure movie has some popularity
      )
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 3);
    
    // If we don't have 3 well-known movies from 2025, fallback to recent popular high-rated movies
    if (topMovies.length < 3) {
      const fallbackRes = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=vote_average.desc&vote_average.gte=7.5&vote_count.gte=500&include_adult=false&include_video=false&page=1&primary_release_date.gte=2024-01-01`
      );
      
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackMovies = fallbackData.results
          .filter(movie => 
            movie.poster_path && 
            !topMovies.find(m => m.id === movie.id) &&
            movie.vote_count >= 500 && // Higher vote count for fallback movies
            movie.popularity > 20 // Higher popularity threshold for fallback
          )
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 3 - topMovies.length);
        
        topMovies = [...topMovies, ...fallbackMovies];
      }
    }
    
    // Final fallback: get top popular movies from TMDB's top rated list
    if (topMovies.length < 3) {
      const topRatedRes = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=1`
      );
      
      if (topRatedRes.ok) {
        const topRatedData = await topRatedRes.json();
        const topRatedMovies = topRatedData.results
          .filter(movie => 
            movie.poster_path && 
            !topMovies.find(m => m.id === movie.id) &&
            movie.vote_count >= 1000 && // Very high vote count for top rated
            movie.vote_average >= 7.5
          )
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 3 - topMovies.length);
        
        topMovies = [...topMovies, ...topRatedMovies];
      }
    }
    
    console.log("Final hero movies:", topMovies.map(m => ({ 
      title: m.title, 
      rating: m.vote_average, 
      votes: m.vote_count, 
      popularity: m.popularity,
      year: m.release_date?.split("-")[0] 
    })));
    
    return topMovies.slice(0, 3);
  } catch (error) {
    console.error("Error fetching top 2025 movies:", error);
    return [];
  }
}

// Alternative function to get the most popular and well-known movies
export async function fetchPopularTopMovies() {
  try {
    // Get movies from popular list (these are well-known and trending)
    const popularRes = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
    );
    
    if (!popularRes.ok) throw new Error("Failed to fetch popular movies");
    const popularData = await popularRes.json();
    
    // Filter for high-rated, well-known movies with significant votes
    let topMovies = popularData.results
      .filter(movie => 
        movie.vote_average >= 7.0 && 
        movie.vote_count >= 500 && 
        movie.poster_path &&
        movie.popularity > 50 // High popularity threshold
      )
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 3);
    
    // If we don't have enough popular movies, get from top rated
    if (topMovies.length < 3) {
      const topRatedRes = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=1`
      );
      
      if (topRatedRes.ok) {
        const topRatedData = await topRatedRes.json();
        const topRatedMovies = topRatedData.results
          .filter(movie => 
            movie.poster_path && 
            !topMovies.find(m => m.id === movie.id) &&
            movie.vote_count >= 2000 && // Very high vote count
            movie.vote_average >= 7.5
          )
          .sort((a, b) => b.vote_average - a.vote_average)
          .slice(0, 3 - topMovies.length);
        
        topMovies = [...topMovies, ...topRatedMovies];
      }
    }
    
    console.log("Popular top movies:", topMovies.map(m => ({ 
      title: m.title, 
      rating: m.vote_average, 
      votes: m.vote_count, 
      popularity: m.popularity,
      year: m.release_date?.split("-")[0] 
    })));
    
    return topMovies.slice(0, 3);
  } catch (error) {
    console.error("Error fetching popular top movies:", error);
    return [];
  }
}
