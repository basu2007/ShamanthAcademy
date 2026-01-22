#!/bin/bash
# Simple one-click deployment script for Shamanth Academy

echo "🚀 Starting Deployment Process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git..."
    git init
    git branch -M dev
fi

# Ask for a commit message
read -p "Enter change description: " message
if [ -z "$message" ]; then
    message="Update Shamanth Academy $(date)"
fi

# Execute Git Flow
git add .
git commit -m "$message"

# Try to push
echo "📤 Pushing to GitHub (this triggers AWS Amplify)..."
git push origin dev

echo "✅ Done! AWS Amplify is now building your changes."
echo "Check progress here: https://console.aws.amazon.com/amplify/home"
