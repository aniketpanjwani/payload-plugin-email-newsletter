# Multi-Channel Setup Guide

**Note**: As of v0.10.0, the Payload Newsletter Plugin uses a single-channel architecture. This document is retained for historical reference only.

## Why Single-Channel?

The plugin was redesigned to use a single-channel architecture because:

1. **Broadcast API Design**: Each Broadcast API token is tied to a specific channel
2. **Simplicity**: One Payload instance = One newsletter channel
3. **Security**: Clear separation between different newsletters
4. **Performance**: No channel lookup overhead

## Migration from Multi-Channel

If you were using multiple channels in earlier versions:

### Option 1: Multiple Payload Instances (Recommended)

Deploy separate Payload instances for each newsletter:

```
payload-newsletter-tech/     # Tech newsletter
├── .env                    # BROADCAST_TOKEN for tech channel
└── payload.config.ts

payload-newsletter-marketing/ # Marketing newsletter  
├── .env                    # BROADCAST_TOKEN for marketing channel
└── payload.config.ts
```

Each instance has its own:
- Broadcast API token (channel-specific)
- Subscriber list
- Broadcast history
- Settings

### Option 2: Single Instance, Manual Channel Switching

If you must use a single instance for multiple channels:

1. Update environment variables when switching channels
2. Restart the application
3. Note that all broadcasts will go to the current channel

```bash
# For tech newsletter
BROADCAST_TOKEN=tech_channel_token npm run dev

# For marketing newsletter (requires restart)
BROADCAST_TOKEN=marketing_channel_token npm run dev
```

**Warning**: This approach is not recommended as it's error-prone and doesn't provide proper separation.

## Current Architecture

See [Single Channel Broadcast Setup](./single-channel-broadcast.md) for the current recommended approach.

## Benefits of Single-Channel Design

1. **Clear Scope**: Each instance manages exactly one newsletter
2. **Better Security**: No risk of sending to wrong channel
3. **Simpler Configuration**: Just one token per instance
4. **Easier Management**: Clear separation of content and subscribers
5. **Better Performance**: No channel queries or lookups

## Questions?

For the current single-channel setup, see:
- [Single Channel Broadcast Setup](./single-channel-broadcast.md)
- [Email Providers Guide](./email-providers.md)