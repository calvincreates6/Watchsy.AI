const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Cloud Function to update movie vote aggregates
exports.updateMovieVotes = functions.firestore
  .document('users/{userId}/votes/{movieId}')
  .onWrite(async (change, context) => {
    const { userId, movieId } = context.params;
    
    try {
      const beforeData = change.before.exists ? change.before.data() : null;
      const afterData = change.after.exists ? change.after.data() : null;
      
      const beforeValue = beforeData ? beforeData.value : 0;
      const afterValue = afterData ? afterData.value : 0;
      
      // Calculate the change in votes
      const likeChange = (afterValue === 1 ? 1 : 0) - (beforeValue === 1 ? 1 : 0);
      const dislikeChange = (afterValue === -1 ? 1 : 0) - (beforeValue === -1 ? 1 : 0);
      
      // Only update if there's a change
      if (likeChange !== 0 || dislikeChange !== 0) {
        const movieVotesRef = db.collection('movieVotes').doc(movieId);
        
        await db.runTransaction(async (transaction) => {
          const movieVotesDoc = await transaction.get(movieVotesRef);
          
          let currentLikes = 0;
          let currentDislikes = 0;
          
          if (movieVotesDoc.exists) {
            const data = movieVotesDoc.data();
            currentLikes = data.likes || 0;
            currentDislikes = data.dislikes || 0;
          }
          
          const newLikes = Math.max(0, currentLikes + likeChange);
          const newDislikes = Math.max(0, currentDislikes + dislikeChange);
          
          transaction.set(movieVotesRef, {
            likes: newLikes,
            dislikes: newDislikes,
            total: newLikes + newDislikes,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        });
        
        console.log(`Updated movie ${movieId}: likes=${likeChange}, dislikes=${dislikeChange}`);
      }
      
      return null;
    } catch (error) {
      console.error('Error updating movie votes:', error);
      throw error;
    }
  });
