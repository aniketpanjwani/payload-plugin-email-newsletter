// Broadcast Webhook Event Types

// Base event structure
export interface BroadcastWebhookEvent {
  type: string
  occurred_at: string
  data: Record<string, any>
}

// Subscriber Events
export interface SubscriberCreatedEvent extends BroadcastWebhookEvent {
  type: 'subscriber.created'
  data: {
    id: string
    email: string
    name?: string
    source?: string
    created_at: string
    attributes?: Record<string, any>
  }
}

export interface SubscriberUpdatedEvent extends BroadcastWebhookEvent {
  type: 'subscriber.updated'
  data: {
    id: string
    email: string
    name?: string
    updated_at: string
    attributes?: Record<string, any>
  }
}

export interface SubscriberDeletedEvent extends BroadcastWebhookEvent {
  type: 'subscriber.deleted'
  data: {
    id: string
    email: string
    deleted_at: string
  }
}

export interface SubscriberSubscribedEvent extends BroadcastWebhookEvent {
  type: 'subscriber.subscribed'
  data: {
    id: string
    email: string
    name?: string
    subscribed_at: string
    attributes?: Record<string, any>
  }
}

export interface SubscriberUnsubscribedEvent extends BroadcastWebhookEvent {
  type: 'subscriber.unsubscribed'
  data: {
    id: string
    email: string
    unsubscribed_at: string
    reason?: string
  }
}

// Broadcast Events
export interface BroadcastScheduledEvent extends BroadcastWebhookEvent {
  type: 'broadcast.scheduled'
  data: {
    broadcast_id: string
    scheduled_for: string
    name: string
  }
}

export interface BroadcastQueueingEvent extends BroadcastWebhookEvent {
  type: 'broadcast.queueing'
  data: {
    broadcast_id: string
    name: string
    recipient_count: number
  }
}

export interface BroadcastSendingEvent extends BroadcastWebhookEvent {
  type: 'broadcast.sending'
  data: {
    broadcast_id: string
    name: string
    sent_count: number
    total_count: number
  }
}

export interface BroadcastSentEvent extends BroadcastWebhookEvent {
  type: 'broadcast.sent'
  data: {
    broadcast_id: string
    name: string
    sent_count: number
    started_at: string
    completed_at: string
  }
}

export interface BroadcastFailedEvent extends BroadcastWebhookEvent {
  type: 'broadcast.failed'
  data: {
    broadcast_id: string
    name: string
    error: string
    failed_at: string
  }
}

export interface BroadcastPartialFailureEvent extends BroadcastWebhookEvent {
  type: 'broadcast.partial_failure'
  data: {
    broadcast_id: string
    name: string
    sent_count: number
    failed_count: number
    total_count: number
  }
}

export interface BroadcastAbortedEvent extends BroadcastWebhookEvent {
  type: 'broadcast.aborted'
  data: {
    broadcast_id: string
    name: string
    aborted_at: string
    reason?: string
  }
}

export interface BroadcastPausedEvent extends BroadcastWebhookEvent {
  type: 'broadcast.paused'
  data: {
    broadcast_id: string
    name: string
    paused_at: string
    sent_count: number
    remaining_count: number
  }
}

// Union type for all handled events
export type HandledWebhookEvent =
  | SubscriberCreatedEvent
  | SubscriberUpdatedEvent
  | SubscriberDeletedEvent
  | SubscriberSubscribedEvent
  | SubscriberUnsubscribedEvent
  | BroadcastScheduledEvent
  | BroadcastQueueingEvent
  | BroadcastSendingEvent
  | BroadcastSentEvent
  | BroadcastFailedEvent
  | BroadcastPartialFailureEvent
  | BroadcastAbortedEvent
  | BroadcastPausedEvent

// Event type constants
export const WEBHOOK_EVENT_TYPES = {
  // Subscriber events
  SUBSCRIBER_CREATED: 'subscriber.created',
  SUBSCRIBER_UPDATED: 'subscriber.updated',
  SUBSCRIBER_DELETED: 'subscriber.deleted',
  SUBSCRIBER_SUBSCRIBED: 'subscriber.subscribed',
  SUBSCRIBER_UNSUBSCRIBED: 'subscriber.unsubscribed',
  
  // Broadcast events
  BROADCAST_SCHEDULED: 'broadcast.scheduled',
  BROADCAST_QUEUEING: 'broadcast.queueing',
  BROADCAST_SENDING: 'broadcast.sending',
  BROADCAST_SENT: 'broadcast.sent',
  BROADCAST_FAILED: 'broadcast.failed',
  BROADCAST_PARTIAL_FAILURE: 'broadcast.partial_failure',
  BROADCAST_ABORTED: 'broadcast.aborted',
  BROADCAST_PAUSED: 'broadcast.paused',
} as const

// Type guard functions
export function isSubscriberEvent(event: BroadcastWebhookEvent): event is SubscriberCreatedEvent | SubscriberUpdatedEvent | SubscriberDeletedEvent | SubscriberSubscribedEvent | SubscriberUnsubscribedEvent {
  return event.type.startsWith('subscriber.')
}

export function isBroadcastEvent(event: BroadcastWebhookEvent): boolean {
  return event.type.startsWith('broadcast.')
}

export function isHandledEvent(event: BroadcastWebhookEvent): event is HandledWebhookEvent {
  return Object.values(WEBHOOK_EVENT_TYPES).includes(event.type as any)
}