import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ---------- Helpers ----------

// Get user identifier (UID preferred, email fallback)
const getUserIdentifier = (user) => {
  // Always use UID if available (Google users and most email/password users)
  if (user.uid) {
    return user.uid;
  }
  // Fallback to sanitized email for edge cases
  return user.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
};

// Get user's collection reference
const getUserCollection = (user, collectionName) => {
  const userId = getUserIdentifier(user);
  return collection(db, "users", userId, collectionName);
};

// Get user's document reference
const getUserDoc = (user, collectionName, docId) => {
  const userId = getUserIdentifier(user);
  return doc(db, "users", userId, collectionName, docId);
};

// Decide timestamp field for ordering
const getTimestampField = (collectionName) => {
  switch (collectionName) {
    case "watchlist": return "addedAt";
    case "watched": return "watchedAt";
    case "liked": return "likedAt";
    default: return "addedAt";
  }
};

// Generic fetcher with flexible user identification
const getUserList = async (user, collectionName) => {
  try {
    const ref = getUserCollection(user, collectionName);

    // Try ordered query first; if it fails (e.g., index/field issues), fall back to unordered
    let snapshot;
    try {
      const q = query(ref, orderBy(getTimestampField(collectionName), "desc"));
      snapshot = await getDocs(q);
    } catch (_) {
      // Fallback without orderBy to avoid 400 errors blocking UI
      snapshot = await getDocs(ref);
    }

    const data = snapshot.docs.map((docSnap) => ({
      docId: docSnap.id,
      ...docSnap.data(),
    }));

    return { success: true, data };
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    return { success: false, error: error.message, data: [] };
  }
};

// ---------- Watchlist Operations ----------

export const addToWatchlist = async (user, movie) => {
  try {
    const ref = getUserCollection(user, "watchlist");
    await addDoc(ref, {
      ...movie,
      addedAt: serverTimestamp(),
      type: "watchlist",
      userUid: user.uid,
      userEmail: user.email,
      userId: getUserIdentifier(user)
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return { success: false, error: error.message };
  }
};

export const removeFromWatchlist = async (user, movieId) => {
  try {
    const ref = getUserCollection(user, "watchlist");
    const q = query(ref, where("id", "==", movieId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "Movie not found in watchlist" };
    }

    await deleteDoc(snapshot.docs[0].ref);
    return { success: true };
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return { success: false, error: error.message };
  }
};

export const getWatchlist = (user) => getUserList(user, "watchlist");

// ---------- Watched Movies Operations ----------

export const addToWatched = async (user, movie) => {
  try {
    const ref = getUserCollection(user, "watched");
    await addDoc(ref, {
      ...movie,
      watchedAt: serverTimestamp(),
      type: "watched",
      userUid: user.uid,
      userEmail: user.email,
      userId: getUserIdentifier(user)
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to watched:", error);
    return { success: false, error: error.message };
  }
};

export const removeFromWatched = async (user, movieId) => {
  try {
    const ref = getUserCollection(user, "watched");
    const q = query(ref, where("id", "==", movieId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "Movie not found in watched list" };
    }

    await deleteDoc(snapshot.docs[0].ref);
    return { success: true };
  } catch (error) {
    console.error("Error removing from watched:", error);
    return { success: false, error: error.message };
  }
};

export const getWatchedList = (user) => getUserList(user, "watched");

// ---------- Liked Movies Operations ----------

export const addToLiked = async (user, movie) => {
  try {
    const ref = getUserCollection(user, "liked");
    await addDoc(ref, {
      ...movie,
      likedAt: serverTimestamp(),
      type: "liked",
      userUid: user.uid,
      userEmail: user.email,
      userId: getUserIdentifier(user)
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding to liked:", error);
    return { success: false, error: error.message };
  }
};

export const removeFromLiked = async (user, movieId) => {
  try {
    const ref = getUserCollection(user, "liked");
    const q = query(ref, where("id", "==", movieId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "Movie not found in liked list" };
    }

    await deleteDoc(snapshot.docs[0].ref);
    return { success: true };
  } catch (error) {
    console.error("Error removing from liked:", error);
    return { success: false, error: error.message };
  }
};

export const getLikedList = (user) => getUserList(user, "liked");

// ---------- Utility Functions ----------

export const checkMovieInList = async (user, movieId, listType) => {
  try {
    const ref = getUserCollection(user, listType);
    const q = query(ref, where("id", "==", movieId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error(`Error checking movie in ${listType}:`, error);
    return false;
  }
};

export const getUserStats = async (user) => {
  try {
    const [watchlist, watched, liked] = await Promise.all([
      getWatchlist(user),
      getWatchedList(user),
      getLikedList(user),
    ]);

    return {
      success: true,
      stats: {
        watchlistCount: watchlist.data?.length || 0,
        watchedCount: watched.data?.length || 0,
        likedCount: liked.data?.length || 0,
      },
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { 
      success: false, 
      error: error.message,
      stats: { watchlistCount: 0, watchedCount: 0, likedCount: 0 },
    };
  }
};

// ---------- Migration from LocalStorage ----------

export const migrateLocalStorageToFirestore = async (user) => {
  try {
    // Check if there's any localStorage data to migrate
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const watchedList = JSON.parse(localStorage.getItem("watchedList") || "[]");
    const likedList = JSON.parse(localStorage.getItem("likedList") || "[]");

    // Only proceed if there's data to migrate
    if (watchlist.length === 0 && watchedList.length === 0 && likedList.length === 0) {
      return { success: true, message: "No data to migrate" };
    }

    console.log(`Migrating ${watchlist.length + watchedList.length + likedList.length} movies to Firestore...`);

    // Migrate each list
    for (const movie of watchlist) {
      const result = await addToWatchlist(user, movie);
      if (!result.success) {
        throw new Error(`Failed to migrate watchlist: ${result.error}`);
      }
    }

    for (const movie of watchedList) {
      const result = await addToWatched(user, movie);
      if (!result.success) {
        throw new Error(`Failed to migrate watched: ${result.error}`);
      }
    }

    for (const movie of likedList) {
      const result = await addToLiked(user, movie);
      if (!result.success) {
        throw new Error(`Failed to migrate liked: ${result.error}`);
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem("watchlist");
    localStorage.removeItem("watchedList");
    localStorage.removeItem("likedList");

    console.log("Migration completed successfully");
    return { success: true, message: "Data migrated successfully" };
  } catch (error) {
    console.error("Error migrating data:", error);
    return { success: false, error: error.message };
  }
};
