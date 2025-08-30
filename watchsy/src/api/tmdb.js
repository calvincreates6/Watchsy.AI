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
