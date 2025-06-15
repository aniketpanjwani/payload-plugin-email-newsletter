# Setting Up Automated npm Publishing

This guide explains how to set up automated publishing to npm using GitHub Actions.

## Prerequisites

1. An npm account with 2FA enabled (using an authenticator app, not SMS)
2. Repository admin access on GitHub

## Setup Steps

### 1. Generate npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click on your profile picture → Access Tokens
3. Click "Generate New Token"
4. Select "Classic Token"
5. Choose type: "Automation" (this bypasses 2FA for CI/CD)
6. Give it a name like "payload-newsletter-plugin-github-actions"
7. Copy the token (you won't see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 3. Choose Your Workflow

We've provided two workflow options:

#### Option A: Tag-based Publishing (`publish.yml`)
- Triggers when you push a version tag (e.g., `v0.1.2`)
- Runs tests, builds, publishes to npm, and creates a GitHub release
- **Recommended for most users**

Usage:
```bash
# After updating version in package.json and CHANGELOG
git add .
git commit -m "chore: release v0.1.2"
git tag v0.1.2
git push origin main --tags
```

#### Option B: Release-based Publishing (`release.yml`)
- Triggers when you create a release through GitHub UI
- Simpler but less automated

Usage:
1. Go to GitHub → Releases → Create new release
2. Choose a tag (create new)
3. Fill in release notes
4. Publish release

## Workflow Features

Both workflows:
- ✅ Use Bun for dependency installation and building
- ✅ Run type checking before publishing
- ✅ Only publish if all checks pass
- ✅ Use npm for actual publishing (most reliable)
- ✅ Support manual triggering via GitHub UI

## Security Considerations

1. **npm Token Security**:
   - Use "Automation" tokens to bypass 2FA
   - Tokens are stored encrypted in GitHub Secrets
   - Only accessible during workflow runs
   - Rotate tokens periodically

2. **Protected Branches**:
   - Consider protecting your main branch
   - Require PR reviews for version bumps

3. **Tag Protection**:
   - Consider protecting version tags
   - Only allow specific users to create release tags

## Testing Your Setup

1. Create a test tag:
   ```bash
   git tag v0.0.0-test
   git push origin v0.0.0-test
   ```

2. Check the Actions tab on GitHub to see if the workflow runs

3. Delete the test tag:
   ```bash
   git push origin :v0.0.0-test
   git tag -d v0.0.0-test
   ```

## Troubleshooting

### "npm ERR! 401 Unauthorized"
- Check that your NPM_TOKEN secret is set correctly
- Ensure the token hasn't expired
- Make sure you selected "Automation" token type

### "npm ERR! 403 Forbidden"
- Check that you have publish permissions for the package
- Ensure the package name isn't taken by someone else

### Workflow doesn't trigger
- Ensure you're pushing tags, not just commits
- Check that the tag matches the pattern (starts with 'v')
- Verify the workflow file is in `.github/workflows/`

## Manual Publishing Fallback

If automated publishing fails, you can always publish manually:
```bash
bun run build
npm publish
```

## Best Practices

1. **Always update version in**:
   - `package.json`
   - `CHANGELOG.md`
   - Commit these changes before tagging

2. **Use semantic versioning**:
   - `v0.1.0` → `v0.1.1` for patches
   - `v0.1.1` → `v0.2.0` for features
   - `v0.2.0` → `v1.0.0` for breaking changes

3. **Test locally first**:
   ```bash
   bun run build
   npm pack --dry-run
   ```

4. **Create detailed release notes** in CHANGELOG.md

## Alternative: Release Please

For even more automation, consider [Release Please](https://github.com/google-github-actions/release-please-action):
- Automatically creates version PRs
- Updates CHANGELOG based on conventional commits
- Creates releases and tags
- Can be combined with our publish workflow