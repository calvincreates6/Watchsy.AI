#!/bin/bash

echo "� Deploying Vote System..."

# Install Cloud Functions dependencies
echo "� Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

# Deploy Cloud Functions
echo "☁️ Deploying Cloud Functions..."
firebase deploy --only functions

# Deploy Firestore rules
echo "� Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "✅ Vote system deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Test voting on movie cards"
echo "2. Check that percentages update in real-time"
echo "3. Verify that non-logged-in users can see vote counts"
