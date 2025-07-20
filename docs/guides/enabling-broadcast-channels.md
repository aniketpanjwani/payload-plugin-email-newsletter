# Enabling Broadcasts and Channels

This guide explains how to enable the newsletter management features (broadcasts and channels) in your Payload project.

## Quick Start

### 1. Enable Newsletter Management in Your Config

```typescript
import { buildConfig } from 'payload'
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      features: {
        newsletterManagement: {
          enabled: true, // This enables channels and broadcasts collections
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
  // ... rest of your config
})
```

### 2. What Collections Are Created

When newsletter management is enabled, the plugin automatically creates:

- **`channels`** - Newsletter channels/publications
- **`broadcasts`** - Individual newsletter emails

### 3. Set Up Your Environment Variables

```bash
# .env
BROADCAST_API_URL=https://your-broadcast-instance.com
BROADCAST_TOKEN=your_channel_api_token_here
```

## Important: Broadcast API Tokens Are Channel-Specific

✅ **Full Multi-Channel Support**: The plugin now supports channel-specific API tokens! Since Broadcast API tokens are channel-specific:

- Each API token only works with one Broadcast channel
- You can now configure different tokens for different channels
- Each channel can connect to a different Broadcast channel

### Setting Up Channel-Specific Tokens

You have two options:

#### Option 1: Global Token (Single Channel)

If you only have one newsletter channel, you can use a global token:

```bash
BROADCAST_TOKEN=your_channel_api_token_here
```

#### Option 2: Channel-Specific Tokens (Multiple Channels)

For multiple channels, configure tokens in the admin UI:

1. Create a channel in the Payload admin
2. Select "Broadcast" as the provider type
3. In the "Provider Config" section that appears:
   - Add your channel-specific API token
   - Optionally override the API URL for this channel
4. Save the channel

Each channel can now have its own token and connect to different Broadcast channels!

## Setting Up Your First Channel

1. **In Broadcast:**
   - Create a channel (if you haven't already)
   - Navigate to Settings → Access Tokens
   - Create a new access token for your channel
   - Copy the token

2. **In Your Payload Project:**
   - Set the `BROADCAST_TOKEN` environment variable
   - Start Payload
   - Navigate to Channels in the admin UI
   - Create a new channel with matching settings

3. **Create Your First Broadcast:**
   - Navigate to Broadcasts in the admin UI
   - Click "Create New"
   - Select your channel
   - Write your newsletter content
   - Send or schedule your broadcast

## Configuration Options

### Minimal Configuration

```typescript
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
```

### Full Configuration with Defaults

```typescript
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
      // Optional defaults (can be overridden in admin UI)
      fromAddress: 'newsletter@example.com',
      fromName: 'My Newsletter',
      replyTo: 'replies@example.com',
    }
  }
})
```

## Admin UI Settings vs Config

Settings can be configured in two places:

1. **In your code config** - Serves as defaults
2. **In the Payload admin UI** - Overrides config defaults

Priority: Admin UI settings > Config defaults

## Testing Your Setup

1. Create a test broadcast
2. Use the preview feature to see how it looks
3. Send a test email to yourself
4. Check that it arrives correctly

## Troubleshooting

### "Broadcast API error" when sending

- Check your API token is correct
- Verify your Broadcast instance URL
- Ensure the token has permissions for the operations you're trying

### Channel not syncing with Broadcast

- The plugin should automatically create channels in Broadcast
- Check the Payload logs for any error messages
- Verify your API token has channel management permissions

## Multi-Channel Configuration Example

Here's how you can set up multiple channels with different Broadcast instances:

### Channel 1: Main Newsletter
- Provider: Broadcast
- Token: `abc123` (from Broadcast instance A)
- API URL: `https://broadcast-a.example.com`

### Channel 2: Product Updates
- Provider: Broadcast  
- Token: `xyz789` (from Broadcast instance B)
- API URL: `https://broadcast-b.example.com`

Each channel operates independently with its own Broadcast channel!