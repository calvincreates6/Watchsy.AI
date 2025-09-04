import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import {
  getWatchlist as getWatchlistFromDB,
  getWatchedList as getWatchedListFromDB,
  getLikedList as getLikedListFromDB,
  addToWatchlist as addToWatchlistInDB,
  removeFromWatchlist as removeFromWatchlistInDB,
  addToWatched as addToWatchedInDB,
  removeFromWatched as removeFromWatchedInDB,
  addToLiked as addToLikedInDB,
  removeFromLiked as removeFromLikedInDB,
  checkMovieInList,
  getUserStats
} from '../services/database';

export const useUserData = () => {
  const [user, loading, error] = useAuthState(auth);
  const [watchlist, setWatchlist] = useState([]);
  const [watchedList, setWatchedList] = useState([]);
  const [likedList, setLikedList] = useState([]);
  const [userStats, setUserStats] = useState({
    watchlistCount: 0,
    watchedCount: 0,
    likedCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load user data when user changes
  useEffect(() => {
    if (user && !loading) {
      // Enforce account isolation: purge any leftover local data on login
      localStorage.removeItem('watchlist');
      localStorage.removeItem('watchedList');
      localStorage.removeItem('likedList');

      loadUserData();
    } else if (!user && !loading) {
      // Clear data when user logs out
      setWatchlist([]);
      setWatchedList([]);
      setLikedList([]);
      setUserStats({ watchlistCount: 0, watchedCount: 0, likedCount: 0 });
    }
  }, [user, loading]);

  const loadUserData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Load all user data from Firestore only
      const [watchlistResult, watchedResult, likedResult, statsResult] = await Promise.all([
        getWatchlistFromDB(user),
        getWatchedListFromDB(user),
        getLikedListFromDB(user),
        getUserStats(user)
      ]);

      if (watchlistResult.success) setWatchlist(watchlistResult.data);
      if (watchedResult.success) setWatchedList(watchedResult.data);
      if (likedResult.success) setLikedList(likedResult.data);
      if (statsResult.success) setUserStats(statsResult.stats);

    } catch (error) {
      // If Firestore fails, show empty lists (no localStorage fallback to avoid cross-account bleed)
      setWatchlist([]);
      setWatchedList([]);
      setLikedList([]);
      setUserStats({ watchlistCount: 0, watchedCount: 0, likedCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Watchlist operations
  const addMovieToWatchlist = async (movie) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await addToWatchlistInDB(user, movie);
    if (result.success) {
      setWatchlist(prev => [movie, ...prev]);
      setUserStats(prev => ({ ...prev, watchlistCount: prev.watchlistCount + 1 }));
    }
    return result;
  };

  const removeMovieFromWatchlist = async (movieId) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await removeFromWatchlistInDB(user, movieId);
    if (result.success) {
      setWatchlist(prev => prev.filter(movie => movie.id !== movieId));
      setUserStats(prev => ({ ...prev, watchlistCount: prev.watchlistCount - 1 }));
    }
    return result;
  };

  // Watched movies operations
  const addMovieToWatched = async (movie) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await addToWatchedInDB(user, movie);
    if (result.success) {
      setWatchedList(prev => [movie, ...prev]);
      setUserStats(prev => ({ ...prev, watchedCount: prev.watchedCount + 1 }));
    }
    return result;
  };

  const removeMovieFromWatched = async (movieId) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await removeFromWatchedInDB(user, movieId);
    if (result.success) {
      setWatchedList(prev => prev.filter(movie => movie.id !== movieId));
      setUserStats(prev => ({ ...prev, watchedCount: prev.watchedCount - 1 }));
    }
    return result;
  };

  // Liked movies operations
  const addMovieToLiked = async (movie) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await addToLikedInDB(user, movie);
    if (result.success) {
      setLikedList(prev => [movie, ...prev]);
      setUserStats(prev => ({ ...prev, likedCount: prev.likedCount + 1 }));
    }
    return result;
  };

  const removeMovieFromLiked = async (movieId) => {
    if (!user) return { success: false, error: "User not authenticated" };
    const result = await removeFromLikedInDB(user, movieId);
    if (result.success) {
      setLikedList(prev => prev.filter(movie => movie.id !== movieId));
      setUserStats(prev => ({ ...prev, likedCount: prev.likedCount - 1 }));
    }
    return result;
  };

  // Check if movie is in a specific list
  const isMovieInList = (movieId, listType) => {
    switch (listType) {
      case 'watchlist':
        return watchlist.some(movie => movie.id === movieId);
      case 'watched':
        return watchedList.some(movie => movie.id === movieId);
      case 'liked':
        return likedList.some(movie => movie.id === movieId);
      default:
        return false;
    }
  };

  return {
    user,
    loading,
    error,
    watchlist,
    watchedList,
    likedList,
    userStats,
    isLoading,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addMovieToWatched,
    removeMovieFromWatched,
    addMovieToLiked,
    removeMovieFromLiked,
    isMovieInList,
    loadUserData
  };
};
