import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const voteOnMovie = async (user, movieId, voteValue) => {
  try {
    if (!user || !user.uid) {
      return { success: false, error: "User must be logged in to vote" };
    }
    
    const voteRef = doc(db, "users", user.uid, "votes", String(movieId));
    
    if (voteValue === 0) {
      await deleteDoc(voteRef);
    } else {
      await setDoc(voteRef, {
        value: voteValue,
        movieId: String(movieId),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error voting on movie:", error);
    return { success: false, error: error.message };
  }
};

export const getUserVote = async (user, movieId) => {
  try {
    if (!user || !user.uid) {
      return { success: true, vote: 0 };
    }
    
    const voteRef = doc(db, "users", user.uid, "votes", String(movieId));
    const voteSnap = await getDoc(voteRef);
    
    if (voteSnap.exists()) {
      const data = voteSnap.data();
      return { success: true, vote: data.value || 0 };
    }
    return { success: true, vote: 0 };
  } catch (error) {
    console.error("Error getting user vote:", error);
    return { success: false, error: error.message, vote: 0 };
  }
};

export const getMovieVotes = async (movieId) => {
  try {
    const votesRef = doc(db, "movieVotes", String(movieId));
    const votesSnap = await getDoc(votesRef);
    
    if (votesSnap.exists()) {
      const data = votesSnap.data();
      const likes = Number(data.likes) || 0;
      const dislikes = Number(data.dislikes) || 0;
      const total = likes + dislikes;
      
      return { 
        success: true, 
        votes: {
          likes,
          dislikes,
          total,
          likePercentage: total > 0 ? Math.round((likes / total) * 100) : 0
        }
      };
    }
    
    return { 
      success: true, 
      votes: { likes: 0, dislikes: 0, total: 0, likePercentage: 0 }
    };
  } catch (error) {
    console.error("Error getting movie votes:", error);
    return { 
      success: false, 
      error: error.message,
      votes: { likes: 0, dislikes: 0, total: 0, likePercentage: 0 }
    };
  }
};
