#!/bin/bash
set -e

echo "Installing workspace dependencies, including build tools..."
npm ci --include=dev

echo "Building backend..."
npm run build --workspace=backend

echo "Build complete!"
