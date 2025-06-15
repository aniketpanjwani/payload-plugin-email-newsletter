# Development Guide

## Quick Start

This project uses Bun as the preferred package manager and runtime.

### Install Dependencies

```bash
bun install
```

### Type Checking

Run TypeScript type checking without emitting files:

```bash
bun typecheck
```

### Generate Type Definitions

Generate TypeScript declaration files:

```bash
bun generate:types
```

### Build

Build the project (both JavaScript and type definitions):

```bash
bun build
```

### Development Mode

Watch for changes and rebuild:

```bash
bun dev
```

### Linting

Run ESLint on the source code:

```bash
bun lint
```

### Clean Build Artifacts

Remove the dist directory:

```bash
bun clean
```

## Common TypeScript Issues

If you encounter TypeScript errors during build:

1. **Module Resolution**: The project uses ESM modules. Import statements should include file extensions for relative imports.
2. **Type Errors**: Run `bun typecheck` to see all TypeScript errors without building.
3. **Missing Types**: Some Payload types might need explicit imports or type assertions.

## Publishing

Before publishing to npm:

1. Ensure all tests pass (when tests are added)
2. Run `bun typecheck` to ensure no TypeScript errors
3. Update version in package.json
4. Update CHANGELOG.md
5. Run `bun build` to ensure it builds successfully
6. Tag the release: `git tag v0.x.x`
7. Push tags: `git push --tags`
8. Publish: `npm publish`