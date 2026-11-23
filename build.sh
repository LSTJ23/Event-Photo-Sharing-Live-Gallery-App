#!/bin/bash
set -e

echo "Installing root dependencies..."
npm ci

echo "Installing backend dependencies..."
cd backend
npm ci

echo "Building backend..."
npm run build

echo "Build complete!"
