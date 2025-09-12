#!/bin/bash

echo "Ì∫Ä Deploying Complete Voting System..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "‚ùå Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "‚ùå Not logged in to Firebase. Please run: firebase login"
    echo "   Then run this script again."
    exit 1
fi

echo "Ì≥¶ Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

echo "‚òÅÔ∏è Deploying Cloud Functions..."
firebase deploy --only functions

echo "Ì¥í Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "Ì¥Ñ Switching to real vote service..."
sed -i 's/votes-mock/votes-real/g' src/components/subcomps/Card.jsx

echo "‚úÖ Voting system deployed successfully!"
echo ""
echo "Ìæ¨ Your voting system is now live!"
echo "   - Votes are stored in Firestore"
echo "   - Cloud Function updates aggregate counts"
echo "   - Real-time percentages and vote counts"
echo "   - Persistent across page refreshes"
echo ""
echo "Ì∑™ Test it:"
echo "   1. Vote on different movies"
echo "   2. Refresh the page"
echo "   3. Vote counts should persist"
echo "   4. Percentages should update in real-time"
