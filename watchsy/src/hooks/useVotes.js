import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import { voteOnMovie, getUserVote, getMovieVotes } from '../services/votes';

export const useVotes = (movieId) => {
  const [user, loading, error] = useAuthState(auth);
  const [userVote, setUserVote] = useState(0);
  const [movieVotes, setMovieVotes] = useState({ likes: 0, dislikes: 0, total: 0, likePercentage: 0 });
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteError, setVoteError] = useState(null);

  // Load user's vote and movie totals
  useEffect(() => {
    if (!movieId) return;

    const loadVotes = async () => {
      setVoteLoading(true);
      setVoteError(null);

      try {
        const [userVoteResult, movieVotesResult] = await Promise.all([
          user && !loading ? getUserVote(user, movieId) : Promise.resolve({ success: true, vote: 0 }),
          getMovieVotes(movieId)
        ]);

        if (userVoteResult.success) {
          setUserVote(userVoteResult.vote);
        }

        if (movieVotesResult.success) {
          setMovieVotes(movieVotesResult.votes);
        }
      } catch (err) {
        console.error('Error loading votes:', err);
        setVoteError(err.message);
      } finally {
        setVoteLoading(false);
      }
    };

    loadVotes();
  }, [movieId, user, loading]);

  // Vote function
  const vote = async (voteValue) => {
    if (!user) {
      setVoteError('Please sign in to vote');
      return { success: false, error: 'Please sign in to vote' };
    }

    setVoteLoading(true);
    setVoteError(null);

    try {
      const result = await voteOnMovie(user, movieId, voteValue);
      
      if (result.success) {
        setUserVote(voteValue);
        // Refresh movie votes after a short delay to let Cloud Function update
        setTimeout(async () => {
          try {
            const movieVotesResult = await getMovieVotes(movieId);
            if (movieVotesResult.success) {
              setMovieVotes(movieVotesResult.votes);
            }
          } catch (err) {
            console.error('Error refreshing votes:', err);
          }
        }, 1000);
      } else {
        setVoteError(result.error);
      }
      
      return result;
    } catch (err) {
      console.error('Error voting:', err);
      setVoteError(err.message);
      return { success: false, error: err.message };
    } finally {
      setVoteLoading(false);
    }
  };

  return {
    userVote,
    movieVotes,
    loading: voteLoading,
    error: voteError,
    vote,
    isLoggedIn: !!user && !loading
  };
};
