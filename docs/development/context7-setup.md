# Context7 MCP Setup Guide

Context7 MCP (Model Context Protocol) provides up-to-date code documentation directly in your LLM prompts. This guide explains how to set it up and why it's valuable for development.

## Why Use Context7?

### The Problem
- LLMs rely on outdated training data (often years old)
- You get hallucinated APIs that don't exist
- Code examples are based on old package versions
- Generic answers don't match your specific library version

### The Solution
Context7 fetches up-to-date, version-specific documentation and code examples straight from the source and places them directly into your prompt context.

## How It Works

1. Write your prompt naturally
2. Tell the LLM to `use context7`
3. Get working code with current APIs

Example prompts:
```text
Create a basic Next.js project with app router. use context7
```

```text
Set up a Payload CMS plugin with TypeScript. use context7
```

## Installation

### Requirements
- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop, or another MCP Client

### Quick Install in Cursor

Go to: `Settings` → `Cursor Settings` → `MCP` → `Add new global MCP server`

#### Remote Server Connection (Recommended)
```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

#### Local Server Connection
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Alternative: Use Bun
```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Install in Other Editors

<details>
<summary><b>Windsurf</b></summary>

Remote connection:
```json
{
  "mcpServers": {
    "context7": {
      "serverUrl": "https://mcp.context7.com/sse"
    }
  }
}
```

Local connection:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>VS Code</b></summary>

Add to your VS Code MCP config:

Remote connection:
```json
"mcp": {
  "servers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

Local connection:
```json
"mcp": {
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop</b></summary>

Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "Context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```
</details>

## Available Tools

Context7 MCP provides two main tools:

### `resolve-library-id`
Resolves a general library name into a Context7-compatible library ID.
- `libraryName` (required): The name of the library to search for

### `get-library-docs`
Fetches documentation for a library using a Context7-compatible library ID.
- `context7CompatibleLibraryID` (required): Exact library ID (e.g., `/mongodb/docs`, `/vercel/next.js`)
- `topic` (optional): Focus on a specific topic (e.g., "routing", "hooks")
- `tokens` (optional, default 10000): Max number of tokens to return

## Common Library IDs

Here are some useful Context7 library IDs for this project:

- `/payloadcms/payload` - Payload CMS documentation
- `/resend/resend-node` - Resend Node.js SDK
- `/vercel/next.js` - Next.js documentation
- `/microsoft/typescript` - TypeScript documentation
- `/facebook/react` - React documentation

## Using Context7 in Development

When working on the Payload Newsletter Plugin, you can use Context7 to:

1. **Get latest Payload patterns**:
   ```text
   Show me the latest Payload CMS plugin architecture patterns. use context7
   ```

2. **Check email provider APIs**:
   ```text
   How do I send bulk emails with Resend's latest API? use context7
   ```

3. **Find React Email examples**:
   ```text
   Create a newsletter template with React Email components. use context7
   ```

## Troubleshooting

### Module Not Found Errors
Try using `bunx` instead of `npx`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### ESM Resolution Issues
Add the experimental flag:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/context7-mcp"]
    }
  }
}
```

### Windows Configuration
Use `cmd` wrapper:
```json
{
  "mcpServers": {
    "context7": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## Best Practices

1. **Always include "use context7"** in your prompts when you need current documentation
2. **Be specific about versions** if you need docs for a particular version
3. **Use topic filtering** to get more focused documentation
4. **Combine with local context** - Context7 works great alongside your local CLAUDE.md

## More Information

- [Context7 Website](https://context7.com)
- [GitHub Repository](https://github.com/upstash/context7)
- [Discord Community](https://upstash.com/discord)