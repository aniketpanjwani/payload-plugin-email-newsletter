# Unsubscribe Sync

The newsletter plugin supports bidirectional synchronization of unsubscribe states between Payload and your email service provider (Broadcast/Resend).

## Overview

By default, the plugin syncs unsubscribes in one direction: when a subscriber is unsubscribed in Payload, they are automatically unsubscribed in your email service. 

With the unsubscribe sync feature enabled, you can also sync unsubscribes from your email service back to Payload, ensuring both systems stay in sync.

## Configuration

### Basic Setup

```typescript
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... other config
      features: {
        unsubscribeSync: {
          enabled: true,
          schedule: '0 * * * *', // Hourly sync
        }
      }
    })
  ]
})
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable unsubscribe sync from email service to Payload |
| `schedule` | `string` | - | Cron schedule for automatic sync (e.g., `'0 * * * *'` for hourly) |
| `queue` | `string` | `'newsletter-sync'` | Queue name for the sync job |

## How It Works

### Broadcast

For Broadcast, the sync job:
1. Polls all subscribers from Broadcast (paginated)
2. Checks each subscriber's `is_active` and `unsubscribed_at` status
3. Updates corresponding Payload subscribers who are unsubscribed in Broadcast but not in Payload
4. Logs the number of synced unsubscribes

### Resend

For Resend, we recommend using webhooks instead of polling for better performance. The polling implementation is available as a fallback.

## Manual Execution

You can manually trigger the sync job in several ways:

### Via API Endpoint

```bash
curl -X GET http://localhost:3000/api/payload-jobs/run?queue=newsletter-sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Via Local API

```typescript
await payload.jobs.run({ queue: 'newsletter-sync' })
```

### Via CLI

```bash
npx payload jobs:run --queue newsletter-sync
```

## Hooks

You can hook into the sync process using the `afterUnsubscribeSync` hook:

```typescript
newsletterPlugin({
  // ... other config
  hooks: {
    afterUnsubscribeSync: async ({ req, syncedCount }) => {
      console.log(`Synced ${syncedCount} unsubscribes`)
      // Send notification, update analytics, etc.
    }
  }
})
```

## Best Practices

1. **Frequency**: Don't sync too frequently. Hourly or daily syncs are usually sufficient.
2. **Monitoring**: Use the `afterUnsubscribeSync` hook to monitor sync operations.
3. **Webhooks**: For Resend, use webhooks instead of polling when possible.
4. **Error Handling**: The job will retry failed syncs based on your Payload job configuration.

## Limitations

- Broadcast requires polling all subscribers as there's no direct API to fetch only unsubscribed users
- Large subscriber lists may take time to sync
- The sync is eventually consistent - there may be a delay between unsubscribe in the email service and sync to Payload