# Status Synchronization Architecture

This document explains how the Payload Newsletter Plugin synchronizes status and analytics data between Payload CMS and external email providers (Broadcast, Resend).

## Current Implementation

### 1. **Real-time Synchronization via Hooks**

The plugin uses Payload collection hooks to maintain synchronization:

#### Create Synchronization
When a broadcast is created in Payload, the `afterChange` hook:
```typescript
// src/collections/Broadcasts.ts
afterChange: async ({ doc, operation, req }) => {
  if (operation === 'create') {
    // Creates broadcast in provider
    const providerBroadcast = await provider.create({...})
    // Updates Payload with provider ID
    await req.payload.update({
      collection: 'broadcasts',
      id: doc.id,
      data: {
        providerId: providerBroadcast.id,
        providerData: providerBroadcast.providerData,
      },
    })
  }
}
```

#### Update Synchronization
The `beforeChange` hook syncs updates with the provider:
- Only syncs if the broadcast is in an editable status
- Updates name, subject, content, settings, and audience segments
- Continues with local update even if provider sync fails

#### Delete Synchronization
The `afterDelete` hook removes broadcasts from the provider:
- Only deletes if the broadcast is in an editable status
- Logs errors but doesn't fail the deletion

### 2. **Action-based Status Updates**

When actions are triggered through endpoints:

```typescript
// src/endpoints/broadcasts/send.ts
// After sending via provider
await req.payload.update({
  collection: collectionSlug,
  id,
  data: {
    status: NewsletterStatus.SENDING,
    sentAt: new Date().toISOString(),
  },
})
```

## Missing Components

### 1. **Webhook Handlers**
Currently not implemented, but would receive real-time updates:
- Status changes (SENDING → SENT, FAILED)
- Analytics updates (opens, clicks, bounces)
- Subscriber events (unsubscribes, complaints)

### 2. **Polling for Status Updates**
Not yet implemented, but recommended for production use.

## Recommended Implementation: Payload Jobs Queue

Use Payload's built-in Jobs Queue to poll providers for status and analytics updates.

### Step 1: Create a Sync Task

```typescript
// src/jobs/tasks/syncBroadcastStatus.ts
import type { TaskConfig } from 'payload'

export const syncBroadcastStatus: TaskConfig<'syncBroadcastStatus'> = {
  slug: 'syncBroadcastStatus',
  
  inputSchema: [
    {
      name: 'broadcastId',
      type: 'text',
      required: true,
    },
    {
      name: 'providerId',
      type: 'text',
      required: true,
    },
    {
      name: 'providerType',
      type: 'select',
      options: ['broadcast', 'resend'],
      required: true,
    },
  ],
  
  outputSchema: [
    {
      name: 'status',
      type: 'text',
    },
    {
      name: 'analytics',
      type: 'json',
    },
  ],
  
  retries: 3,
  
  handler: async ({ input, req }) => {
    const { broadcastId, providerId, providerType } = input
    
    // Get provider instance
    const provider = await getProvider(providerType, req.payload.config)
    
    // Fetch current status from provider
    const providerBroadcast = await provider.get(providerId)
    
    // Map provider status to Payload status
    const status = mapProviderStatus(providerBroadcast.status)
    
    // Update Payload if status changed
    const currentDoc = await req.payload.findByID({
      collection: 'broadcasts',
      id: broadcastId,
    })
    
    if (currentDoc.status !== status) {
      await req.payload.update({
        collection: 'broadcasts',
        id: broadcastId,
        data: {
          status,
          analytics: providerBroadcast.analytics,
          providerData: providerBroadcast,
        },
      })
    }
    
    return {
      output: {
        status,
        analytics: providerBroadcast.analytics,
      },
    }
  },
}
```

### Step 2: Queue Jobs After Actions

Modify the send endpoint to queue a delayed status check:

```typescript
// In src/endpoints/broadcasts/send.ts
// After sending the broadcast
await req.payload.jobs.queue({
  task: 'syncBroadcastStatus',
  input: {
    broadcastId: id,
    providerId: broadcastDoc.providerId,
    providerType: channel.providerType,
  },
  waitUntil: new Date(Date.now() + 5 * 60 * 1000), // Check after 5 minutes
})
```

### Step 3: Create a Periodic Sync Task

For ongoing broadcasts, create a task that syncs all active broadcasts:

```typescript
// src/jobs/tasks/syncAllBroadcasts.ts
export const syncAllBroadcasts: TaskConfig<'syncAllBroadcasts'> = {
  slug: 'syncAllBroadcasts',
  
  handler: async ({ req }) => {
    // Find all broadcasts that need syncing
    const broadcasts = await req.payload.find({
      collection: 'broadcasts',
      where: {
        status: {
          in: [BroadcastStatus.SENDING, BroadcastStatus.SCHEDULED],
        },
      },
    })
    
    // Queue individual sync jobs
    for (const broadcast of broadcasts.docs) {
      await req.payload.jobs.queue({
        task: 'syncBroadcastStatus',
        input: {
          broadcastId: broadcast.id,
          providerId: broadcast.providerId,
          providerType: broadcast.channel.providerType,
        },
      })
    }
    
    return { output: { synced: broadcasts.docs.length } }
  },
}
```

### Step 4: Configure Jobs in Payload Config

```typescript
// In plugin configuration
export const newsletterPlugin: NewsletterPluginConfig = {
  jobs: {
    tasks: [syncBroadcastStatus, syncAllBroadcasts],
    
    // For dedicated servers (not serverless)
    autoRun: [
      {
        cron: '*/15 * * * *', // Every 15 minutes
        queue: 'newsletter-sync',
        limit: 50,
      },
    ],
  },
}
```

### Step 5: Manual Sync Endpoint

For immediate sync requests:

```typescript
// src/endpoints/broadcasts/sync.ts
export const createSyncBroadcastEndpoint = (): Endpoint => ({
  path: '/:id/sync',
  method: 'post',
  handler: async (req) => {
    const broadcast = await req.payload.findByID({
      collection: 'broadcasts',
      id: req.params.id,
    })
    
    await req.payload.jobs.queue({
      task: 'syncBroadcastStatus',
      input: {
        broadcastId: broadcast.id,
        providerId: broadcast.providerId,
        providerType: broadcast.channel.providerType,
      },
    })
    
    return Response.json({ 
      success: true, 
      message: 'Sync job queued' 
    })
  },
})
```

## Deployment Considerations

### Serverless Platforms (Vercel, Netlify)

Use external cron services or Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/payload-jobs/run?queue=newsletter-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Dedicated Servers

Use Payload's built-in cron:

```bash
# Or via process manager
npx payload jobs:run --queue newsletter-sync --cron "*/15 * * * *"
```

## Status Mapping

Different providers use different status names. Here's the recommended mapping:

```typescript
function mapProviderStatus(providerStatus: string): BroadcastStatus {
  const statusMap = {
    // Broadcast statuses
    'draft': BroadcastStatus.DRAFT,
    'scheduled': BroadcastStatus.SCHEDULED,
    'sending': BroadcastStatus.SENDING,
    'sent': BroadcastStatus.SENT,
    'failed': BroadcastStatus.FAILED,
    
    // Resend statuses
    'created': BroadcastStatus.DRAFT,
    'queued': BroadcastStatus.SCHEDULED,
    'sending': BroadcastStatus.SENDING,
    'delivered': BroadcastStatus.SENT,
    'bounced': BroadcastStatus.FAILED,
  }
  
  return statusMap[providerStatus.toLowerCase()] || BroadcastStatus.DRAFT
}
```

## Analytics Synchronization

The sync task should also update analytics:

```typescript
// In sync handler
if (providerBroadcast.analytics) {
  await req.payload.update({
    collection: 'broadcasts',
    id: broadcastId,
    data: {
      'analytics.sent': providerBroadcast.analytics.sent || 0,
      'analytics.delivered': providerBroadcast.analytics.delivered || 0,
      'analytics.opened': providerBroadcast.analytics.opened || 0,
      'analytics.clicked': providerBroadcast.analytics.clicked || 0,
      'analytics.bounced': providerBroadcast.analytics.bounced || 0,
      'analytics.complained': providerBroadcast.analytics.complained || 0,
      'analytics.unsubscribed': providerBroadcast.analytics.unsubscribed || 0,
    },
  })
}
```

## Future Enhancements

1. **Webhook Support**: Add endpoints to receive real-time updates from providers
2. **Configurable Sync Intervals**: Allow users to configure how often to poll
3. **Sync History**: Track sync operations for debugging
4. **Batch Operations**: Sync multiple broadcasts in a single API call
5. **Event Streaming**: Use webhooks to stream subscriber events