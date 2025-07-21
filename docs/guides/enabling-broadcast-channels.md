# Enabling Broadcasts

This guide explains how to enable the broadcast management features in your Payload project.

**Note**: As of v0.10.0, the plugin uses a single-channel architecture. Each Payload instance connects to one Broadcast channel.

## Quick Start

### 1. Enable Newsletter Management

```typescript
import { buildConfig } from 'payload'
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      features: {
        newsletterManagement: {
          enabled: true, // This enables the broadcasts collection
        }
      },
      providers: {
        default: 'broadcast',
        broadcast: {
          apiUrl: process.env.BROADCAST_API_URL,
          token: process.env.BROADCAST_TOKEN, // Determines your channel
          fromAddress: 'newsletter@example.com',
          fromName: 'My Newsletter',
          replyTo: 'replies@example.com',
        }
      }
    })
  ],
  // ... rest of your config
})
```

### 2. Set Up Environment Variables

```bash
# .env
BROADCAST_API_URL=https://your-broadcast-instance.com
BROADCAST_TOKEN=your_channel_api_token_here
```

### 3. What Gets Created

When newsletter management is enabled, the plugin creates:

- **`broadcasts`** collection - Individual newsletter emails
- **Newsletter Settings** global - Email provider configuration
- Custom endpoints for sending and scheduling

## Understanding the Single-Channel Design

Since v0.10.0, the plugin embraces Broadcast's token architecture:

- **One Token = One Channel**: Each Broadcast API token is tied to a specific channel
- **One Instance = One Newsletter**: Each Payload instance manages one newsletter
- **Simple Configuration**: Just one token per instance

This design:
- ✅ Aligns with how Broadcast API tokens work
- ✅ Simplifies configuration and management
- ✅ Provides clear separation between different newsletters
- ✅ Eliminates channel selection complexity

## Setting Up Your Broadcast Channel

### 1. In Broadcast:
1. Create a channel (if you haven't already)
2. Navigate to Settings → Access Tokens
3. Create a new access token for your channel
4. Copy the token

### 2. In Your Payload Project:
1. Set the `BROADCAST_TOKEN` environment variable
2. Configure the plugin (see Quick Start above)
3. Start Payload
4. Your broadcasts will automatically sync with this channel

### 3. Create Your First Broadcast:
1. Navigate to Broadcasts in the admin UI
2. Click "Create New"
3. Fill in the subject and content
4. Use the inline preview to see how it looks
5. Send or schedule your broadcast

## Configuration Options

### Basic Configuration

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

### Full Configuration

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
      fromAddress: 'newsletter@example.com',
      fromName: 'My Newsletter',
      replyTo: 'replies@example.com',
      // These can be overridden in Newsletter Settings
    }
  }
})
```

## Features Available

When broadcasts are enabled:

1. **Broadcast Management**
   - Create, edit, and delete broadcasts
   - Rich text editor with email-safe formatting
   - Image uploads (requires Media collection)
   - Custom blocks (buttons, dividers)

2. **Email Preview** (v0.12.0+)
   - Live preview with React Email
   - Desktop and mobile views
   - Custom template support

3. **Provider Sync**
   - Automatic sync with Broadcast API
   - Status tracking
   - Analytics (opens, clicks, etc.)

4. **Sending Options**
   - Send immediately
   - Schedule for later
   - Test mode sending

## Testing Your Setup

1. **Create a Test Broadcast**
   - Use a simple subject like "Test Email"
   - Add some content with formatting
   - Preview it in the editor

2. **Send a Test**
   - Use test mode to send to yourself
   - Verify it arrives correctly
   - Check that tracking works

3. **Check Sync**
   - Verify the broadcast appears in your Broadcast dashboard
   - Confirm status updates sync back to Payload

## Troubleshooting

### "Broadcast API error" when sending
- Check your API token is correct
- Verify your Broadcast instance URL
- Ensure the token has send permissions

### Broadcasts not syncing
- Check Payload logs for error messages
- Verify API token has correct permissions
- Ensure BROADCAST_API_URL includes protocol (https://)

### Images not showing in preview
- Ensure you have a Media collection configured
- Check that images are uploaded before previewing
- Verify media URL in your Payload config

## Multiple Newsletters?

If you need multiple separate newsletters:

1. **Recommended**: Deploy separate Payload instances
   ```
   newsletter-tech/      # Tech newsletter instance
   newsletter-marketing/ # Marketing newsletter instance
   ```

2. **Not Recommended**: Manual token switching (error-prone)

See [Single Channel Broadcast Setup](./single-channel-broadcast.md) for more details.

## Next Steps

- Set up [custom email templates](../features/email-preview.md)
- Configure [subscriber management](./quick-start.md)
- Review [email provider options](./email-providers.md)