#!/bin/bash

# Release script for Payload Newsletter Plugin
# This script bumps version locally and pushes, letting CI handle the release
# Usage: ./scripts/release-local.sh [patch|minor|major]

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
    echo "Usage: ./scripts/release-local.sh [patch|minor|major]"
    echo ""
    echo "This script will:"
    echo "  1. Bump version in package.json"
    echo "  2. Update CHANGELOG.md" 
    echo "  3. Commit and push changes"
    echo "  4. CI will automatically create tag, GitHub release, and publish to npm"
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

# Bump version
echo -e "\n${YELLOW}Bumping version...${NC}"
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix if present
echo -e "New version: ${GREEN}$NEW_VERSION${NC}"

# Update CHANGELOG
echo -e "\n${YELLOW}Updating CHANGELOG.md...${NC}"
DATE=$(date +%Y-%m-%d)

# Create temporary file with new version header
cat > temp_changelog.md << EOF
## [$NEW_VERSION] - $DATE

### Added
- 

### Changed
- 

### Fixed
- 

EOF

# Append existing changelog
if [ -f CHANGELOG.md ]; then
    cat CHANGELOG.md >> temp_changelog.md
    mv temp_changelog.md CHANGELOG.md
else
    mv temp_changelog.md CHANGELOG.md
fi

echo -e "${GREEN}✓ CHANGELOG.md updated${NC}"
echo -e "\n${YELLOW}Please edit CHANGELOG.md to add your changes for v$NEW_VERSION${NC}"
echo "Opening CHANGELOG.md in your default editor..."

# Try to open in default editor
if command -v code &> /dev/null; then
    code CHANGELOG.md
elif command -v nano &> /dev/null; then
    nano CHANGELOG.md
elif command -v vim &> /dev/null; then
    vim CHANGELOG.md
else
    echo -e "${YELLOW}Please manually edit CHANGELOG.md${NC}"
fi

echo -e "\n${YELLOW}Press Enter when you're done editing CHANGELOG.md...${NC}"
read

# Run tests
echo -e "\n${YELLOW}Running tests...${NC}"
if ! bun test; then
    echo -e "${RED}Tests failed! Please fix before releasing.${NC}"
    exit 1
fi

# Run type check
echo -e "\n${YELLOW}Running type check...${NC}"
if ! bun typecheck; then
    echo -e "${RED}Type check failed! Please fix before releasing.${NC}"
    exit 1
fi

# Show what will be committed
echo -e "\n${YELLOW}Changes to be committed:${NC}"
git diff --stat package.json CHANGELOG.md

# Confirm
echo -e "\n${YELLOW}Ready to release v$NEW_VERSION as a $VERSION_TYPE release.${NC}"
echo -e "This will:"
echo -e "  1. Commit the version bump and changelog"
echo -e "  2. Push to main branch"  
echo -e "  3. Trigger CI to create tag, GitHub release, and npm publish"
echo -e "\n${YELLOW}Continue? (y/N)${NC}"
read -r confirmation

if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Release cancelled${NC}"
    # Revert version bump
    git checkout -- package.json CHANGELOG.md
    exit 1
fi

# Commit changes
echo -e "\n${YELLOW}Committing changes...${NC}"
git add package.json CHANGELOG.md
git commit -m "chore: release v$NEW_VERSION

- Bumped version from $CURRENT_VERSION to $NEW_VERSION
- Updated CHANGELOG.md"

# Push changes
echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
git push origin main

echo -e "\n${GREEN}✅ Version $NEW_VERSION committed and pushed!${NC}"
echo -e "${YELLOW}GitHub Actions will now:${NC}"
echo -e "  - Run tests and build"
echo -e "  - Create git tag v$NEW_VERSION"
echo -e "  - Create GitHub release"
echo -e "  - Publish to npm"
echo -e "\n${YELLOW}Monitor the progress at:${NC}"
echo -e "https://github.com/aniketpanjwani/payload-plugin-email-newsletter/actions"