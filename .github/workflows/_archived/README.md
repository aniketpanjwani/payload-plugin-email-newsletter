# Archived Workflows

These workflows have been replaced by the simplified publish-release.yml workflow.

They are kept here for reference only and should not be used.

## Old Workflow Issues

1. **auto-release.yml** - Modified code by committing version bumps, causing sync issues
2. **publish.yml** - Redundant tag-based publishing
3. **release.yml** - Broken npm authentication

## New Approach

All releases now follow this pattern:
1. Developer bumps version locally
2. Developer updates CHANGELOG and commits
3. CI/CD detects version change and publishes to npm

No code is ever modified by the CI/CD system.