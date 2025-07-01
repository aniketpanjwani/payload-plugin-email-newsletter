#!/bin/bash

# Release script for Payload Newsletter Plugin
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if version type is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify version type (patch, minor, or major)${NC}"
    echo "Usage: ./scripts/release.sh [patch|minor|major]"
    echo ""
    echo "Release policy:"
    echo "  - patch: Automatic for bug fixes (or manual)"
    echo "  - minor: Manual only for new features" 
    echo "  - major: Manual only for breaking changes"
    exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type '$VERSION_TYPE'${NC}"
    echo "Must be one of: patch, minor, major"
    exit 1
fi

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

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "\n${BLUE}Release Type: $VERSION_TYPE${NC}"
echo -e "${YELLOW}This will trigger the GitHub Actions release workflow.${NC}"

if [[ "$VERSION_TYPE" == "minor" || "$VERSION_TYPE" == "major" ]]; then
    echo -e "\n${YELLOW}⚠️  WARNING: You are creating a $VERSION_TYPE release!${NC}"
    echo -e "This should only be done for:"
    if [[ "$VERSION_TYPE" == "minor" ]]; then
        echo -e "  - New features that are backwards compatible"
        echo -e "  - Significant enhancements to existing features"
    else
        echo -e "  - Breaking changes to the API"
        echo -e "  - Major architectural changes"
        echo -e "  - Removal of deprecated features"
    fi
    echo -e "\n${YELLOW}Are you sure you want to continue? (y/N)${NC}"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        echo -e "${RED}Release cancelled${NC}"
        exit 1
    fi
fi

# Trigger the workflow
echo -e "\n${YELLOW}Triggering release workflow...${NC}"
gh workflow run "Release" \
    --ref main \
    -f release_type="$VERSION_TYPE"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Release workflow triggered successfully!${NC}"
    echo -e "${YELLOW}Monitor the progress at:${NC}"
    echo -e "https://github.com/aniketpanjwani/payload-plugin-email-newsletter/actions/workflows/auto-release.yml"
    echo ""
    echo -e "${BLUE}The workflow will:${NC}"
    echo -e "  1. Run tests and build"
    echo -e "  2. Bump version to $VERSION_TYPE"
    echo -e "  3. Update CHANGELOG.md"
    echo -e "  4. Create git tag and GitHub release"
    echo -e "  5. Publish to npm"
else
    echo -e "${RED}❌ Failed to trigger workflow${NC}"
    exit 1
fi