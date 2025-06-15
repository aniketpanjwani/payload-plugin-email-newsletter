#!/bin/bash

# Release script for Payload Newsletter Plugin
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if version type is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify version type (patch, minor, or major)${NC}"
    echo "Usage: ./scripts/release.sh [patch|minor|major]"
    exit 1
fi

VERSION_TYPE=$1

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: You must be on the main branch to release${NC}"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Ensure working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: Working directory is not clean${NC}"
    echo "Please commit or stash your changes first"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull origin main

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}$CURRENT_VERSION${NC}"

# Calculate new version
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix if present

echo -e "New version: ${GREEN}$NEW_VERSION${NC}"

# Update CHANGELOG
echo -e "\n${YELLOW}Please update CHANGELOG.md with changes for v$NEW_VERSION${NC}"
echo "Press Enter when done..."
read

# Run type check
echo -e "\n${YELLOW}Running type check...${NC}"
bun typecheck

# Run build
echo -e "\n${YELLOW}Building package...${NC}"
bun run build

# Commit changes
echo -e "\n${YELLOW}Committing changes...${NC}"
git add .
git commit -m "chore: release v$NEW_VERSION"

# Create tag
echo -e "\n${YELLOW}Creating tag v$NEW_VERSION...${NC}"
git tag "v$NEW_VERSION"

# Push changes and tag
echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
git push origin main --tags

echo -e "\n${GREEN}✅ Release v$NEW_VERSION created successfully!${NC}"
echo -e "${YELLOW}GitHub Actions will now automatically publish to npm${NC}"
echo -e "\nYou can monitor the progress at:"
echo -e "https://github.com/aniketpanjwani/payload-plugin-email-newsletter/actions"