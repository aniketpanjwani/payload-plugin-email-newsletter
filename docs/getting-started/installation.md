# Installation Guide

This guide covers all installation options and requirements for the Payload Newsletter Plugin.

## Requirements

- **Payload CMS**: Version 3.0.0 or higher
- **Node.js**: Version 18 or 20 (recommended)
- **React**: Version 18.0.0 or higher
- **TypeScript**: Version 5.0.0 or higher (optional but recommended)

## Package Managers

### npm
```bash
npm install payload-plugin-newsletter
```

### Yarn
```bash
yarn add payload-plugin-newsletter
```

### Bun (Recommended)
```bash
bun add payload-plugin-newsletter
```

## Peer Dependencies

The plugin requires these peer dependencies (should already be installed with Payload):

- `payload` ^3.0.0
- `react` ^18.0.0
- `react-dom` ^18.0.0

## Version Compatibility

| Plugin Version | Payload Version | Node Version |
|----------------|-----------------|--------------|
| 0.4.x          | 3.x             | 18, 20       |
| 0.3.x          | 3.x             | 18, 20       |

## TypeScript Setup

The plugin includes TypeScript definitions. No additional setup required, but you may want to configure path mapping:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "payload-plugin-newsletter": ["./node_modules/payload-plugin-newsletter/dist/index"],
      "payload-plugin-newsletter/*": ["./node_modules/payload-plugin-newsletter/dist/*"]
    }
  }
}
```

## Module Resolution

The plugin uses ES modules and provides multiple entry points:

```typescript
// Main plugin
import { newsletterPlugin } from 'payload-plugin-newsletter'

// Client components
import { NewsletterForm } from 'payload-plugin-newsletter/client'

// Types only
import type { NewsletterPluginConfig } from 'payload-plugin-newsletter/types'

// Individual components
import { PreferencesForm } from 'payload-plugin-newsletter/components'
```

## Verifying Installation

After installation, verify the plugin is working:

1. Add to your Payload config:
```typescript
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      emailProvider: {
        provider: 'resend',
        config: {
          apiKey: 'test_key',
          fromAddress: 'test@example.com',
          fromName: 'Test'
        }
      }
    })
  ]
})
```

2. Start Payload and check for:
   - "Subscribers" collection in admin
   - "Newsletter Settings" global in admin
   - No console errors

## Troubleshooting

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Type Errors
```bash
# Ensure TypeScript is up to date
npm install -D typescript@latest
```

### Build Errors
```bash
# Clear build cache
rm -rf dist .tsbuildinfo
npm run build
```

## Next Steps

- [Configure the plugin](./configuration.md)
- [Set up email providers](../guides/email-providers.md)
- [Create your first newsletter](./first-newsletter.md)