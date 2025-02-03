#!/bin/bash

# Check if version argument is provided
if [ -z "$1" ]; then
  echo "Please provide a version number (e.g. ./release.sh 1.0.0)"
  exit 1
fi

VERSION=$1

# Ensure working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Working directory is not clean. Please commit or stash changes first."
  exit 1
fi

# Update version in package.json and create git tag
npm version $VERSION

# Push changes and tags
git push origin main --tags

# Create GitHub release
gh release create "v$VERSION" \
  --title "v$VERSION" \
  --generate-notes 