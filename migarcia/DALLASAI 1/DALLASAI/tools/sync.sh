#!/bin/bash
# BSG Demo Platform - Sync Script (Unix/Mac)
# Commits all changes and pushes to GitHub

if [ -z "$1" ]; then
    echo "Usage: ./sync.sh 'commit message'"
    exit 1
fi

MESSAGE="$1"
BRANCH=$(git symbolic-ref --short HEAD)

echo "BSG Demo Platform - Sync to GitHub"
echo "================================="
echo "Current branch: $BRANCH"

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit."
    exit 0
fi

# Show what will be committed
echo ""
echo "Changes to commit:"
git status --short

# Add all changes
echo ""
echo "Staging all changes..."
git add .

# Commit
echo "Committing with message: $MESSAGE"
git commit -m "$MESSAGE"

if [ $? -ne 0 ]; then
    echo "Commit failed!"
    exit 1
fi

# Push to GitHub
echo ""
echo "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "Successfully synced to GitHub!"
else
    echo ""
    echo "Push failed. Please check your connection and try again."
    exit 1
fi


