import type { PayloadRequest } from 'payload'
import type { 
  BroadcastScheduledEvent,
  BroadcastSendingEvent,
  BroadcastSentEvent,
  BroadcastFailedEvent,
  BroadcastPartialFailureEvent,
  BroadcastAbortedEvent,
  BroadcastPausedEvent,
  BroadcastWebhookEvent
} from '../../types/webhooks'
import type { NewsletterPluginConfig } from '../../types'
import { WEBHOOK_EVENT_TYPES } from '../../types/webhooks'

// Map Broadcast webhook status to our status
const STATUS_MAP: Record<string, string> = {
  'broadcast.scheduled': 'scheduled',
  'broadcast.queueing': 'sending',
  'broadcast.sending': 'sending',
  'broadcast.sent': 'sent',
  'broadcast.failed': 'failed',
  'broadcast.partial_failure': 'sent', // With warning flag
  'broadcast.aborted': 'canceled',
  'broadcast.paused': 'paused',
}

export async function handleBroadcastEvent(
  event: BroadcastWebhookEvent,
  req: PayloadRequest,
  _config: NewsletterPluginConfig
): Promise<void> {
  const { payload } = req
  const broadcastsSlug = 'broadcasts' // Newsletter management collection is always 'broadcasts'
  
  const status = STATUS_MAP[event.type]
  if (!status) {
    console.warn('[Broadcast Handler] Unknown event type:', event.type)
    return
  }
  
  try {
    await updateBroadcastStatus(event, status, payload, broadcastsSlug)
  } catch (error) {
    console.error('[Broadcast Handler] Error handling event:', {
      type: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

async function updateBroadcastStatus(
  event: BroadcastWebhookEvent,
  status: string,
  payload: any,
  broadcastsSlug: string
): Promise<void> {
  const { data } = event
  const broadcastId = data.broadcast_id
  
  if (!broadcastId) {
    console.error('[Broadcast Handler] No broadcast_id in event data')
    return
  }
  
  try {
    // Find broadcast by external ID
    const existing = await payload.find({
      collection: broadcastsSlug,
      where: {
        externalId: {
          equals: broadcastId,
        },
      },
      limit: 1,
    })
    
    if (existing.docs.length === 0) {
      console.warn('[Broadcast Handler] Broadcast not found:', broadcastId)
      return
    }
    
    const broadcast = existing.docs[0]
    const updateData: any = {
      status,
      lastWebhookEvent: event.type,
      lastWebhookEventAt: event.occurred_at,
    }
    
    // Add event-specific data
    switch (event.type) {
      case WEBHOOK_EVENT_TYPES.BROADCAST_SCHEDULED:
        updateData.scheduledAt = (event as BroadcastScheduledEvent).data.scheduled_for
        break
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_SENDING: {
        const sendingEvent = event as BroadcastSendingEvent
        updateData.sentCount = sendingEvent.data.sent_count
        updateData.totalCount = sendingEvent.data.total_count
        break
      }
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_SENT: {
        const sentEvent = event as BroadcastSentEvent
        updateData.sentCount = sentEvent.data.sent_count
        updateData.sentAt = sentEvent.data.completed_at
        updateData.sendingStartedAt = sentEvent.data.started_at
        break
      }
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_FAILED: {
        const failedEvent = event as BroadcastFailedEvent
        updateData.failureReason = failedEvent.data.error
        updateData.failedAt = failedEvent.data.failed_at
        break
      }
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_PARTIAL_FAILURE: {
        const partialFailureEvent = event as BroadcastPartialFailureEvent
        updateData.sentCount = partialFailureEvent.data.sent_count
        updateData.failedCount = partialFailureEvent.data.failed_count
        updateData.totalCount = partialFailureEvent.data.total_count
        updateData.hasWarnings = true
        break
      }
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_ABORTED: {
        const abortedEvent = event as BroadcastAbortedEvent
        updateData.abortedAt = abortedEvent.data.aborted_at
        updateData.abortReason = abortedEvent.data.reason
        break
      }
        
      case WEBHOOK_EVENT_TYPES.BROADCAST_PAUSED: {
        const pausedEvent = event as BroadcastPausedEvent
        updateData.pausedAt = pausedEvent.data.paused_at
        updateData.sentCount = pausedEvent.data.sent_count
        updateData.remainingCount = pausedEvent.data.remaining_count
        break
      }
    }
    
    // Update broadcast
    await payload.update({
      collection: broadcastsSlug,
      id: broadcast.id,
      data: updateData,
    })
    
    console.log('[Broadcast Handler] Updated broadcast status:', {
      broadcastId,
      status,
      event: event.type,
    })
  } catch (error) {
    console.error('[Broadcast Handler] Error updating broadcast:', error)
    throw error
  }
}