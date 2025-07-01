# Release Process

This document describes the release process for the Payload Newsletter Plugin.

## Overview

The plugin uses a simple, developer-controlled release process:
- **All version bumps happen locally** - You control when and what type of release
- **CI/CD only publishes** - Automatically publishes to npm when it detects a version change
- **No code modifications by bots** - Your local repo never gets out of sync

## Release Types

### Patch Releases (x.x.X)
- **When**: Bug fixes, documentation updates, dependency updates
- **Example**: `0.7.2` → `0.7.3`

### Minor Releases (x.X.0)
- **When**: New features, significant enhancements
- **Example**: `0.7.3` → `0.8.0`

### Major Releases (X.0.0)
- **When**: Breaking changes, major architectural changes
- **Example**: `0.8.0` → `1.0.0`

## How Releases Work

1. **Developer bumps version locally**:
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Update CHANGELOG.md** with the changes

3. **Commit and push**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release v0.7.3"
   git push
   ```

4. **CI/CD automatically**:
   - Detects the new version in package.json
   - Runs tests (must pass!)
   - Creates git tag
   - Publishes to npm
   - Creates GitHub release

## Handling Test Failures

If tests fail during the release process:

1. **The release is blocked** - No npm publish occurs
2. **Fix the tests** and push the fix
3. **CI/CD will retry** - It detects the tag exists but npm doesn't have the version
4. **Successful publish** - Once tests pass, it publishes to npm

This means you DON'T need to bump the version again if tests fail initially!

## Release Script

A helper script is available to streamline the release process:

```bash
./scripts/release-local.sh patch  # or minor, or major
```

This script:
- Bumps the version
- Updates CHANGELOG.md template
- Opens your editor to fill in changes
- Runs tests locally
- Commits and pushes

## Manual Process

If you prefer to do it manually:

```bash
# 1. Bump version
npm version minor --no-git-tag-version

# 2. Update CHANGELOG.md

# 3. Test locally
bun test
bun typecheck

# 4. Commit and push
git add package.json CHANGELOG.md
git commit -m "chore: release v0.8.0"
git push
```

## Commit Message Convention

While not enforced for automatic patch releases, following these conventions helps track changes:

- `fix:` - Bug fixes
- `feat:` - New features
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes
- `refactor:` - Code refactoring

Add `!` for breaking changes: `feat!: restructure API`

## Pre-Release Checklist

Before triggering a minor or major release:

1. **Update Documentation**
   - [ ] Update README.md with new features
   - [ ] Update API documentation
   - [ ] Add migration guide (for major releases)

2. **Test Thoroughly**
   - [ ] Run `bun test` locally
   - [ ] Test in a real project
   - [ ] Verify TypeScript types export correctly

3. **Review Changes**
   - [ ] Review all commits since last release
   - [ ] Ensure no breaking changes in minor releases
   - [ ] Update peer dependency versions if needed

## CI/CD Workflow Details

The publish workflow (`publish-release.yml`):

1. **Triggers on**: Changes to package.json on main branch
2. **Version Detection**: Compares package.json version with git tags and npm
3. **Retry Logic**: If tag exists but npm publish failed, it retries
4. **Concurrency Control**: Only one release can run at a time
5. **Publishing**: Uses `NPM_TOKEN` secret from GitHub Secrets

## Troubleshooting

### Release Failed

1. Check [GitHub Actions](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/actions)
2. Common issues:
   - npm authentication failed → Check `NPM_TOKEN` secret
   - Tests failed → Fix tests before releasing
   - Version already exists → Manual version bump may be needed

### Accidental Release

If an unwanted release was triggered:
1. Unpublish from npm (within 72 hours): `npm unpublish payload-plugin-newsletter@VERSION`
2. Delete the GitHub release and tag
3. Fix the issue and release a new patch version

### Multiple Workflows Triggered

This shouldn't happen with current setup, but if it does:
- The concurrency group will prevent parallel releases
- Check for deprecated workflow files that may still be active

## Best Practices

1. **Keep main branch stable** - All commits to main trigger releases
2. **Use feature branches** - Develop features in branches, merge when ready
3. **Write clear commit messages** - They become CHANGELOG entries
4. **Test before merging** - Broken builds block releases
5. **Document breaking changes** - Essential for major releases

## Security

- npm publishes require `NPM_TOKEN` (stored in GitHub Secrets)
- Only maintainers can push to main branch
- Only maintainers can trigger manual releases
- All releases create an audit trail in GitHub Actions

## Questions?

If you encounter issues with the release process:
1. Check this documentation
2. Review recent GitHub Actions runs
3. Open an issue if the problem persists