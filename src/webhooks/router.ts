import type { PayloadRequest } from 'payload'
import type { BroadcastWebhookEvent, HandledWebhookEvent } from '../types/webhooks'
import type { NewsletterPluginConfig } from '../types'
import { isHandledEvent, isSubscriberEvent, isBroadcastEvent } from '../types/webhooks'
import { handleSubscriberEvent } from './handlers/subscriber'
import { handleBroadcastEvent } from './handlers/broadcast'

export async function routeWebhookEvent(
  event: BroadcastWebhookEvent,
  req: PayloadRequest,
  config: NewsletterPluginConfig
): Promise<void> {
  try {
    // Check if this is an event we handle
    if (!isHandledEvent(event)) {
      console.log('[Webhook Router] Ignoring unhandled event type:', event.type)
      return
    }
    
    const handledEvent = event as HandledWebhookEvent
    
    // Route to appropriate handler
    if (isSubscriberEvent(handledEvent)) {
      await handleSubscriberEvent(handledEvent, req, config)
    } else if (isBroadcastEvent(handledEvent)) {
      await handleBroadcastEvent(handledEvent, req, config)
    } else {
      console.warn('[Webhook Router] Event type not routed:', event.type)
    }
  } catch (error) {
    console.error('[Webhook Router] Error routing event:', {
      type: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}