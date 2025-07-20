# Single Channel Broadcast Setup

## Overview

The Payload Newsletter Plugin uses a single-channel architecture that aligns perfectly with how Broadcast API tokens work. This guide explains the design and how to use it effectively.

## Key Concept: One Token = One Channel

In Broadcast:
- Each API token is tied to a specific channel
- The token determines which channel you're accessing
- You cannot access multiple channels with one token

The plugin embraces this by using a single-channel design:
- **One Payload instance = One Broadcast channel**
- **One configuration = One newsletter**

## Benefits of Single Channel Design

1. **Simplicity**: No complex channel selection or management
2. **Clear Scope**: Each Payload instance manages one newsletter
3. **Security**: Token scope is limited to one channel
4. **Performance**: No overhead of channel lookups
5. **Alignment**: Matches Broadcast's token architecture

## Configuration

```typescript
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
          token: process.env.BROADCAST_TOKEN, // This determines your channel
          fromAddress: 'newsletter@example.com',
          fromName: 'My Newsletter',
          replyTo: 'replies@example.com',
        }
      }
    })
  ],
})
```

## How It Works

1. **Token = Channel**: Your Broadcast token determines which channel you're connected to
2. **All Operations**: Every operation (broadcasts, subscribers, transactional emails) goes through this channel
3. **No Channel Selection**: No need to select channels in the UI - everything is automatic

## Common Use Cases

### Use Case 1: Company Newsletter

```bash
# .env
BROADCAST_API_URL=https://broadcast.company.com
BROADCAST_TOKEN=token_for_company_newsletter_channel
```

All broadcasts go to your company newsletter subscribers.

### Use Case 2: Product Updates

```bash
# .env
BROADCAST_API_URL=https://broadcast.company.com
BROADCAST_TOKEN=token_for_product_updates_channel
```

Separate instance for product update announcements.

### Use Case 3: Internal Communications

```bash
# .env
BROADCAST_API_URL=https://internal-broadcast.company.com
BROADCAST_TOKEN=token_for_internal_channel
```

Dedicated instance for internal team updates.

## Managing Multiple Newsletters

If you need multiple separate newsletters, you have several options:

### Option 1: Multiple Payload Instances

Deploy separate Payload instances, each with its own:
- Database
- Broadcast token (different channel)
- Admin URL
- Subscriber base

### Option 2: Use Segments

Use a single channel but segment your audience:
- Create segments in Broadcast
- Target different segments with different broadcasts
- Manage all from one Payload instance

### Option 3: Wait for Multi-Channel

Future versions will support multiple channels per instance. For now, single-channel keeps things simple and reliable.

## Migration from Multi-Channel

If you previously used a version with channels collection:

1. **Choose Your Primary Channel**: Decide which channel to keep
2. **Update Configuration**: Set the token for that channel
3. **Remove References**: The channels collection is no longer needed
4. **Update Broadcasts**: They no longer need channel selection

## Best Practices

1. **Name Your Instance**: Make it clear what newsletter this Payload manages
2. **Document Your Channel**: Keep track of which Broadcast channel you're connected to
3. **Separate Concerns**: Use different instances for different types of communications
4. **Monitor Usage**: Each channel has its own sending limits and analytics

## FAQ

### Can I change which channel I'm connected to?

Yes, just update your `BROADCAST_TOKEN` to a token from a different channel and restart.

### What about transactional emails?

All transactional emails (welcome, magic link) go through the same channel as your broadcasts.

### Can I see which channel I'm connected to?

The channel is determined by your token. Check your Broadcast dashboard to see which channel the token belongs to.

### Will multi-channel support come back?

Yes, but as an advanced feature. Single-channel will remain the default for simplicity.

## Conclusion

The single-channel design makes the plugin simpler, more secure, and perfectly aligned with how Broadcast works. For most use cases, one newsletter per Payload instance is the clearest and most maintainable approach.