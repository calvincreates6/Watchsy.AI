import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import {
  addToWatchlist as addToWatchlistInDB,
  removeFromWatchlist as removeFromWatchlistInDB,
  addToWatched as addToWatchedInDB,
  removeFromWatched as removeFromWatchedInDB,
  addToLiked as addToLikedInDB,
  removeFromLiked as removeFromLikedInDB,
  getUserDoc,
} from '../services/database';
import { collection, onSnapshot, query, limit as fsLimit } from 'firebase/firestore';
import { setDoc } from "firebase/firestore";

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
      // Rely on realtime listeners for initial data; no manual fetch
    } else if (!user && !loading) {
      // Clear data when user logs out
      setWatchlist([]);
      setWatchedList([]);
      setLikedList([]);
      setUserStats({ watchlistCount: 0, watchedCount: 0, likedCount: 0 });
    }
  }, [user, loading]);

  // Live listeners to keep lists in sync across components
  useEffect(() => {
    if (!user || loading) return;

    const userId = user.uid || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous');

    const wlRef = collection(db, 'users', userId, 'watchlist');
    const wdRef = collection(db, 'users', userId, 'watched');
    const lkRef = collection(db, 'users', userId, 'liked');

    const wlQuery = query(wlRef, fsLimit(200));
    const wdQuery = query(wdRef, fsLimit(200));
    const lkQuery = query(lkRef, fsLimit(200));

    setIsLoading(true);

    let got = { wl: false, wd: false, lk: false };

    const unsubWl = onSnapshot(wlQuery, (snap) => {
      const data = snap.docs.map(d => d.data());
      setWatchlist(data);
      setUserStats(prev => ({ ...prev, watchlistCount: data.length }));
      got.wl = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    }, () => {
      got.wl = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    });

    const unsubWd = onSnapshot(wdQuery, (snap) => {
      const data = snap.docs.map(d => d.data());
      setWatchedList(data);
      setUserStats(prev => ({ ...prev, watchedCount: data.length }));
      got.wd = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    }, () => {
      got.wd = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    });

    const unsubLk = onSnapshot(lkQuery, (snap) => {
      setLikedList(prev => {
        const next = snap.docs.map(d => {
          const doc = d.data();
          const prevMovie = prev.find(m => m.id === doc.id);
          return { ...doc, favorite: (doc.favorite !== undefined ? doc.favorite : (prevMovie ? !!prevMovie.favorite : false)) };
        });
        return next;
      });
      setUserStats(prev => ({ ...prev, likedCount: snap.size }));
      got.lk = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    }, () => {
      got.lk = true;
      if (got.wl && got.wd && got.lk) setIsLoading(false);
    });

    return () => {
      unsubWl();
      unsubWd();
      unsubLk();
    };
  }, [user, loading]);

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
      setUserStats(prev => ({ ...prev, watchlistCount: Math.max(0, prev.watchlistCount - 1) }));
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
      setUserStats(prev => ({ ...prev, watchedCount: Math.max(0, prev.watchedCount - 1) }));
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
      setUserStats(prev => ({ ...prev, likedCount: Math.max(0, prev.likedCount - 1) }));
    }
    return result;
  };

  const toggleFavoriteInDB = async (user, movieId, isFavorite) => {
    try {
      const ref = getUserDoc(user, "liked", movieId);
      await setDoc(ref, {
        favorite: !isFavorite
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      return { success: false, error: error.message };
    }
  };

  const toggleFavorite = async (movieId) => {
    if (!user) return { success: false, error: "Please login to toggle favorite status" };
    const movie = likedList.find(m => m.id === movieId);
    if (!movie) return { success: false, error: "Movie not found in liked list" };
    const result = await toggleFavoriteInDB(user, movieId, movie.favorite);
    if (result.success) {
      setLikedList(prev => prev.map(m => m.id === movieId ? { ...m, favorite: !m.favorite } : m));
      return { success: true };
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
    toggleFavorite,
    isMovieInList
  };
};
