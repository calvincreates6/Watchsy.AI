// Mock vote service for testing UI - different data per movie
const mockVoteData = {
  'F1': { likes: 3, dislikes: 1, total: 4, likePercentage: 75 },
  '1000 : Another F1 story': { likes: 2, dislikes: 2, total: 4, likePercentage: 50 },
  'F1H1B': { likes: 1, dislikes: 0, total: 1, likePercentage: 100 },
  'f.180': { likes: 0, dislikes: 3, total: 3, likePercentage: 0 },
  'default': { likes: 1, dislikes: 1, total: 2, likePercentage: 50 }
};

export const voteOnMovie = async (user, movieId, voteValue) => {
  console.log('Mock vote:', { user: user?.uid, movieId, voteValue });
  return { success: true };
};

export const getUserVote = async (user, movieId) => {
  console.log('Mock getUserVote:', { user: user?.uid, movieId });
  return { success: true, vote: 0 };
};

export const getMovieVotes = async (movieId) => {
  console.log('Mock getMovieVotes:', movieId);
  const movieData = mockVoteData[movieId] || mockVoteData['default'];
  return { success: true, votes: movieData };
};
