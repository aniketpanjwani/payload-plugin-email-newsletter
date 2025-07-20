# How to Enable Broadcasts and Channels

## Quick Setup Instructions

### 1. Update Your Payload Config

Add the newsletter plugin with broadcast management enabled:

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // Enable broadcast management
      features: {
        newsletterManagement: {
          enabled: true,
        }
      },
      // Configure Broadcast provider
      providers: {
        default: 'broadcast',
        broadcast: {
          apiUrl: process.env.BROADCAST_API_URL,
          token: process.env.BROADCAST_TOKEN,
        }
      }
    })
  ],
  // ... rest of your config
})
```

### 2. Set Environment Variables

```bash
# .env
BROADCAST_API_URL=https://your-broadcast-instance.com
BROADCAST_TOKEN=your_broadcast_api_token
```

### 3. Get Your Broadcast API Token

1. Log into your Broadcast instance
2. Go to Settings → Access Tokens
3. Click "Create Access Token"
4. Give it a name and select permissions
5. Copy the generated token
6. Add it to your `.env` file

### 4. Restart Payload

After adding the plugin configuration and environment variables, restart your Payload server.

### 5. You're Ready! 

You'll now see a new collection in your admin panel:
- **Broadcasts** - Create and send newsletters

## What Gets Created

When you enable newsletter management, the plugin automatically creates:

**Broadcasts Collection** 
- Create newsletter content
- Preview emails
- Send or schedule broadcasts
- Track sending status
- Manage all newsletters for your channel

## Important: One Token = One Channel

Since Broadcast API tokens are channel-specific:

- **One Payload instance connects to ONE Broadcast channel**
- The token you provide determines which channel you're connected to
- All broadcasts and transactional emails go through this channel

### Want Multiple Channels?

For now, if you need multiple Broadcast channels, you'll need:
- Multiple Payload instances (each with its own token)
- Or wait for multi-channel support in a future update

This keeps things simple and aligns with how Broadcast tokens work.

## Next Steps

1. Create your first broadcast
2. Use the preview feature to see how it looks
3. Send a test email to yourself
4. Send to all subscribers when ready!

## Minimal Working Example

Here's the absolute minimum configuration needed:

```typescript
// payload.config.ts
export default buildConfig({
  plugins: [
    newsletterPlugin({
      features: {
        newsletterManagement: {
          enabled: true,
        }
      },
      providers: {
        default: 'broadcast',
        broadcast: {
          apiUrl: process.env.BROADCAST_API_URL,
          token: process.env.BROADCAST_TOKEN,
        }
      }
    })
  ],
})
```

That's it! You now have full newsletter management capabilities in Payload.