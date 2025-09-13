import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Get user identifier (UID preferred, email fallback)
const getUserIdentifier = (user) => {
  if (!user) {
    throw new Error('User is required');
  }
  if (user.uid) {
    return user.uid;
  }
  if (user.email && typeof user.email === 'string') {
    return user.email.replace(/[^a-zA-Z0-9]/g, '_');
  }
  return 'anonymous';
};

// Vote on a movie (1 = like, -1 = dislike, 0 = remove vote)
export const voteOnMovie = async (user, movieId, voteValue) => {
  try {
    if (!user) {
      return { success: false, error: 'User must be logged in to vote' };
    }
    
    const userId = getUserIdentifier(user);
    const voteRef = doc(db, 'users', userId, 'votes', movieId);
    
    if (voteValue === 0) {
      // Remove vote
      await deleteDoc(voteRef);
    } else {
      // Set vote
      await setDoc(voteRef, {
        value: voteValue,
        movieId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error voting on movie:', error);
    return { success: false, error: error.message };
  }
};

// Get user's vote for a movie
export const getUserVote = async (user, movieId) => {
  try {
    if (!user) {
      return { success: true, vote: 0 };
    }
    
    const userId = getUserIdentifier(user);
    const voteRef = doc(db, 'users', userId, 'votes', movieId);
    const voteSnap = await getDoc(voteRef);
    
    if (voteSnap.exists()) {
      return { success: true, vote: voteSnap.data().value };
    }
    return { success: true, vote: 0 };
  } catch (error) {
    console.error('Error getting user vote:', error);
    return { success: false, error: error.message, vote: 0 };
  }
};

// Get movie vote counts (public)
export const getMovieVotes = async (movieId) => {
  try {
    const votesRef = doc(db, 'movieVotes', movieId);
    const votesSnap = await getDoc(votesRef);
    
    if (votesSnap.exists()) {
      const data = votesSnap.data();
      const total = (data.likes || 0) + (data.dislikes || 0);
      return { 
        success: true, 
        votes: {
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          total,
          likePercentage: total > 0 ? Math.round(((data.likes || 0) / total) * 100) : 0
        }
      };
    }
    return { 
      success: true, 
      votes: { likes: 0, dislikes: 0, total: 0, likePercentage: 0 }
    };
  } catch (error) {
    console.error('Error getting movie votes:', error);
    return { 
      success: false, 
      error: error.message,
      votes: { likes: 0, dislikes: 0, total: 0, likePercentage: 0 }
    };
  }
};

// Get multiple movie votes at once
export const getMultipleMovieVotes = async (movieIds) => {
  try {
    const promises = movieIds.map(id => getMovieVotes(id));
    const results = await Promise.all(promises);
    
    const votesMap = {};
    movieIds.forEach((id, index) => {
      votesMap[id] = results[index].votes;
    });
    
    return { success: true, votes: votesMap };
  } catch (error) {
    console.error('Error getting multiple movie votes:', error);
    return { success: false, error: error.message, votes: {} };
  }
};
