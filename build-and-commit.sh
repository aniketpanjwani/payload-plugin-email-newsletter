#!/bin/bash

# Exit on error
set -e

echo "🔧 Installing dependencies..."
bun install

echo "🧹 Cleaning dist directory..."
bun run clean

echo "🏗️ Building package with tsup..."
bun run build

echo "📦 Verifying dist directory..."
ls -la dist/

echo "✅ Build complete!"

echo "📋 Git status:"
git status

echo ""
echo "To commit and push these changes, run:"
echo "  git add -A"
echo "  git commit -m 'fix: add tsup build system for proper ESM/CJS dual package support'"
echo "  git push"