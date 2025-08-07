import type { PayloadRequest } from 'payload'
import type { SubscriberSubscribedEvent, SubscriberUnsubscribedEvent } from '../../types/webhooks'
import type { NewsletterPluginConfig } from '../../types'
import { WEBHOOK_EVENT_TYPES } from '../../types/webhooks'

export async function handleSubscriberEvent(
  event: SubscriberSubscribedEvent | SubscriberUnsubscribedEvent,
  req: PayloadRequest,
  config: NewsletterPluginConfig
): Promise<void> {
  const { payload } = req
  const subscribersSlug = config.subscribersSlug || 'subscribers'
  
  switch (event.type) {
    case WEBHOOK_EVENT_TYPES.SUBSCRIBER_SUBSCRIBED:
      await handleSubscriberSubscribed(event as SubscriberSubscribedEvent, payload, subscribersSlug)
      break
      
    case WEBHOOK_EVENT_TYPES.SUBSCRIBER_UNSUBSCRIBED:
      await handleSubscriberUnsubscribed(event as SubscriberUnsubscribedEvent, payload, subscribersSlug)
      break
      
    default:
      console.warn('[Subscriber Handler] Unhandled event type:', (event as any).type)
  }
}

async function handleSubscriberSubscribed(
  event: SubscriberSubscribedEvent,
  payload: any,
  subscribersSlug: string
): Promise<void> {
  const { data } = event
  
  try {
    // Check if subscriber already exists
    const existing = await payload.find({
      collection: subscribersSlug,
      where: {
        email: {
          equals: data.email,
        },
      },
      limit: 1,
    })
    
    if (existing.docs.length > 0) {
      // Update existing subscriber to active
      const subscriber = existing.docs[0]
      
      await payload.update({
        collection: subscribersSlug,
        id: subscriber.id,
        data: {
          subscriptionStatus: 'active',
          subscribedAt: data.subscribed_at,
          // Store Broadcast ID for future reference
          externalId: data.id,
          // Update attributes if provided
          ...(data.attributes && { attributes: data.attributes }),
        },
      })
      
      console.log('[Subscriber Handler] Reactivated subscriber:', data.email)
    } else {
      // Create new subscriber
      await payload.create({
        collection: subscribersSlug,
        data: {
          email: data.email,
          name: data.name,
          subscriptionStatus: 'active',
          subscribedAt: data.subscribed_at,
          externalId: data.id,
          attributes: data.attributes || {},
        },
      })
      
      console.log('[Subscriber Handler] Created new subscriber:', data.email)
    }
  } catch (error) {
    console.error('[Subscriber Handler] Error handling subscribed event:', error)
    throw error
  }
}

async function handleSubscriberUnsubscribed(
  event: SubscriberUnsubscribedEvent,
  payload: any,
  subscribersSlug: string
): Promise<void> {
  const { data } = event
  
  try {
    // Find subscriber by email
    const existing = await payload.find({
      collection: subscribersSlug,
      where: {
        email: {
          equals: data.email,
        },
      },
      limit: 1,
    })
    
    if (existing.docs.length > 0) {
      const subscriber = existing.docs[0]
      
      // Update to unsubscribed
      await payload.update({
        collection: subscribersSlug,
        id: subscriber.id,
        data: {
          subscriptionStatus: 'unsubscribed',
          unsubscribedAt: data.unsubscribed_at,
          unsubscribeReason: data.reason,
        },
      })
      
      console.log('[Subscriber Handler] Unsubscribed:', data.email)
    } else {
      console.warn('[Subscriber Handler] Subscriber not found for unsubscribe:', data.email)
    }
  } catch (error) {
    console.error('[Subscriber Handler] Error handling unsubscribed event:', error)
    throw error
  }
}