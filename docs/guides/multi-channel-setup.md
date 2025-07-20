# Multi-Channel Setup Guide

This guide explains how to set up multiple newsletter channels, each connected to different Broadcast channels.

## Understanding Channel-Specific Tokens

Broadcast API tokens are channel-specific, meaning:
- Each token provides access to only one Broadcast channel
- Different channels require different tokens
- The plugin now fully supports this architecture

## Configuration Options

### Option 1: Single Channel (Simple Setup)

For a single newsletter channel, use environment variables:

```typescript
// payload.config.ts
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

```bash
# .env
BROADCAST_API_URL=https://broadcast.example.com
BROADCAST_TOKEN=your_token_here
```

### Option 2: Multiple Channels (Advanced Setup)

For multiple channels with different Broadcast instances:

1. **Minimal Config** (tokens configured in admin UI):
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
      // Only set the default API URL
      apiUrl: process.env.BROADCAST_API_URL,
      // Don't set token - configure per channel
    }
  }
})
```

2. **Configure Each Channel in Admin UI**:
   - Navigate to Channels
   - Create a new channel
   - Select "Broadcast" as provider
   - In "Provider Config" section:
     - Enter the channel-specific token
     - Optionally override the API URL

## Example Multi-Channel Setup

### Scenario: Company with Multiple Newsletters

**Channel 1: Customer Newsletter**
- Name: "Customer Updates"
- Provider: Broadcast
- Token: `token_customer_abc123`
- Broadcast Channel: "customers" on main instance

**Channel 2: Developer Newsletter**
- Name: "Dev Updates"
- Provider: Broadcast
- Token: `token_dev_xyz789`
- API URL: `https://dev-broadcast.company.com`
- Broadcast Channel: "developers" on dev instance

**Channel 3: Internal Newsletter**
- Name: "Team Updates"
- Provider: Broadcast
- Token: `token_internal_qrs456`
- Broadcast Channel: "internal" on main instance

## Step-by-Step Setup

### 1. Create Channels in Broadcast

For each newsletter you want:
1. Log into your Broadcast instance
2. Create a new channel
3. Generate an API token for that channel
4. Note the token and channel details

### 2. Configure Payload

Add the plugin with minimal config:
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
          // Optionally set a default token for fallback
          token: process.env.BROADCAST_DEFAULT_TOKEN,
        }
      }
    })
  ],
})
```

### 3. Create Channels in Payload Admin

For each channel:
1. Go to Channels → Create New
2. Fill in basic info (name, from email, etc.)
3. Select "Broadcast" as provider
4. In Provider Config:
   - Add the channel-specific token
   - Override API URL if using different instance
5. Save

### 4. Create and Send Broadcasts

1. Go to Broadcasts → Create New
2. Select the appropriate channel
3. Create your content
4. Send to the right audience!

## Token Priority

The plugin uses tokens in this order:
1. Channel-specific token (if configured)
2. Global token from config (fallback)
3. Error if no token found

## Benefits of Multi-Channel Setup

- **Separation of Concerns**: Different teams can manage different newsletters
- **Different Environments**: Dev/staging/prod channels can use different Broadcast instances
- **Security**: Channel-specific tokens limit access scope
- **Flexibility**: Each channel can have different settings and configurations

## Troubleshooting

### "No API token configured for this channel"
- Ensure the channel has a token in Provider Config
- Or set a default token in the plugin config

### "Failed to create channel in provider"
- Verify the token has proper permissions
- Check the API URL is correct
- Ensure the Broadcast instance is accessible

### Broadcasts not syncing
- Check that the channel's token is valid
- Verify the channel was created successfully (has a providerId)
- Check Payload logs for detailed error messages