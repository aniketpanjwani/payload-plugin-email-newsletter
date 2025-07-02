# Claude Development Guidelines

This file contains development guidelines and reference information for Claude when working on the Payload Newsletter Plugin.

**Note**: This plugin is developed by Aniket Panjwani, who uses Broadcast (sendbroadcast.net) for newsletter management.

## Payload CMS Documentation Reference

The official Payload CMS documentation is available locally at:
`/Users/aniketpanjwani/Projects/reference_repos/payload/docs/`

Key directories for plugin development:
- `plugins/` - Official plugin examples and patterns
- `rest-api/` - REST API documentation and endpoint patterns
- `custom-components/` - Custom views and UI components
- `configuration/` - Core configuration patterns
- `hooks/` - Hook system documentation
- `authentication/` - Auth patterns and examples
- `local-api/` - Local API usage patterns
- `typescript/` - TypeScript patterns and best practices

When developing features, always reference these docs for:
1. Current Payload v3 patterns and best practices
2. Endpoint handler signatures and request/response formats
3. Authentication and authorization patterns
4. Plugin architecture guidelines
5. TypeScript type definitions and interfaces

### Critical Payload v3 Endpoint Patterns

From the official Payload v3 REST API documentation (`rest-api/overview.mdx`):

1. **Request Body Access**: 
   - Data is NOT automatically appended to the request
   - Use `await req.json()` to read the body
   - Or use `await addDataAndFileToRequest(req)` helper to mutate req and add req.data

2. **Response Format**:
   - Return `Response.json()` objects, not `res.status().json()`
   - Example: `return Response.json({ message: 'success' }, { status: 200 })`

3. **Cookie Access**:
   - Cookies are NOT available at `req.cookies`
   - Access via request headers instead

4. **Handler Signature**:
   ```ts
   handler: async (req) => {
     // NOT (req, res) - just req!
     const data = await req.json() // or use addDataAndFileToRequest(req)
     return Response.json({ result: 'data' })
   }
   ```

**Current Plugin Bug**: The newsletter plugin endpoints are using old Payload v2 patterns:
- Trying to access `req.data` directly (undefined)
- Trying to access `req.cookies` directly (undefined)
- Need to update ALL endpoints to use the new patterns

## Important Security Guidelines

**NEVER include any of the following in the repository:**
- API keys or tokens (use environment variables)
- Email addresses or personal information
- Specific company/project names (keep everything generic)
- Production URLs or endpoints
- Any credentials or sensitive configuration

## Reference Documentation

Use these resources for understanding patterns and best practices:

1. **Plugin Documentation**:
   - Check `docs/` directory for comprehensive plugin documentation
   - `docs/references/broadcast-api-docs.md` - Complete Broadcast API reference (sendbroadcast.net)
   - `docs/guides/email-providers.md` - Email provider setup and comparison
   - `docs/development/context7-setup.md` - How to set up context7 MCP for current docs
   - `docs/architecture/` - Plugin architecture and design decisions

2. **Context7 MCP Setup**:
   - Install context7 MCP in your editor (see `docs/development/context7-setup.md`)
   - Add "use context7" to prompts for up-to-date documentation
   - Essential library IDs:
     - `/payloadcms/payload` - Payload CMS docs
     - `/resend/resend-node` - Resend API docs
     - `/vercel/next.js` - Next.js docs
     - `/microsoft/typescript` - TypeScript docs

3. **Email Provider Information**:
   - **Resend**: Managed service, easy setup, higher cost per email
   - **Broadcast**: Self-hosted at sendbroadcast.net, cost-effective (license + VPS + SES), requires setup
   - Follow provider-agnostic patterns in `src/types/index.ts`

4. **Development Resources**:
   - `docs/development/` - Contributing guidelines and setup
   - `docs/api-reference/` - Complete API documentation
   - `docs/getting-started/` - Quick start guides

## Development Setup

This project uses **Bun** as the preferred package manager and runtime.

### Available Commands
- `bun install` - Install dependencies
- `bun typecheck` - Run TypeScript type checking
- `bun generate:types` - Generate TypeScript declarations
- `bun build` - Build the project (JS + types)
- `bun dev` - Watch mode for development
- `bun lint` - Run ESLint
- `bun clean` - Clean build artifacts

## Development Guidelines

### Code Style
- Follow Payload's patterns from official plugins
- Use TypeScript for everything
- No comments unless specifically requested
- Keep implementations generic and reusable

### Plugin Design Principles
1. **Generic by Default**: Everything should work for any Payload project
2. **Configuration Over Code**: Use config options rather than hardcoded values
3. **Follow Payload Patterns**: Match the style of official plugins
4. **User-Friendly**: Clear documentation and intuitive defaults

### Testing Approach
- Test with generic data only
- Use example.com for email addresses
- Use placeholder text for content
- Never use real API keys in tests

### Documentation
- Keep README focused on user needs
- Include clear examples
- Document all configuration options
- Link to FEEDBACK.md for design decisions

## Common Tasks

### When Adding New Features
1. Check reference implementations for patterns
2. Keep everything configurable
3. Add TypeScript types
4. Update documentation
5. Make progressive commits

### When Updating CHANGELOG.md
1. First check the current date with: `date +"%Y-%m-%d"`
2. Use the actual current date in changelog entries
3. Follow semantic versioning principles

### When Reviewing Reference Code
- Extract patterns, not implementations
- Generalize any specific logic
- Remove all identifying information
- Focus on the architecture

## Environment Variables

When documenting environment variables, always use generic examples:
```bash
RESEND_API_KEY=your_resend_api_key_here
BROADCAST_TOKEN=your_broadcast_token_here
JWT_SECRET=your_jwt_secret_here
```

## Git Workflow

1. Make small, focused commits
2. Use conventional commit messages (feat:, fix:, docs:, etc.)
3. Push regularly to: https://github.com/aniketpanjwani/payload-plugin-email-newsletter
4. Keep sensitive information in gitignored directories

## Questions to Always Consider

Before implementing any feature, ask:
1. Is this generic enough for any Payload project?
2. Are there any hardcoded values that should be configurable?
3. Does this follow Payload's established patterns?
4. Is this well-documented for users?