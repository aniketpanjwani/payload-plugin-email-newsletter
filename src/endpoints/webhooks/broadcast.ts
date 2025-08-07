import type { PayloadRequest } from 'payload'
import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import type { BroadcastWebhookEvent } from '../../types/webhooks'
import { verifyBroadcastWebhookSignature } from '../../utils/webhooks/signature'
import { routeWebhookEvent } from '../../webhooks/router'

export const createBroadcastWebhookEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/webhooks/broadcast',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      try {
        // Get webhook secret from settings
        const settings = await req.payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
        })
        
        const webhookSecret = settings?.broadcastSettings?.webhookSecret
        
        if (!webhookSecret) {
          console.error('[Broadcast Webhook] No webhook secret configured')
          return Response.json({ error: 'Webhook not configured' }, { status: 401 })
        }
        
        // Extract headers
        const headers = req.headers as Headers
        const signature = headers.get('x-broadcast-signature')
        const timestamp = headers.get('x-broadcast-timestamp')
        
        if (!signature || !timestamp) {
          console.error('[Broadcast Webhook] Missing signature or timestamp')
          return Response.json({ error: 'Invalid request' }, { status: 401 })
        }
        
        // Get raw body for signature verification
        let rawBodyString: string
        let rawBody: any
        
        // Handle Payload v3 request body
        if (typeof req.json === 'function') {
          rawBody = await req.json()
          rawBodyString = JSON.stringify(rawBody)
        } else {
          console.error('[Broadcast Webhook] Request does not support json() method')
          return Response.json({ error: 'Invalid request' }, { status: 400 })
        }
        
        // Verify signature
        const isValid = verifyBroadcastWebhookSignature(
          rawBodyString,
          signature,
          timestamp,
          webhookSecret
        )
        
        if (!isValid) {
          console.error('[Broadcast Webhook] Invalid signature')
          return Response.json({ error: 'Invalid signature' }, { status: 401 })
        }
        
        // Use the already parsed body
        const data = rawBody as BroadcastWebhookEvent
        
        // Log received webhook for debugging
        console.log('[Broadcast Webhook] Verified event:', {
          type: data.type,
          timestamp: new Date().toISOString(),
        })
        
        // Route event to appropriate handler
        await routeWebhookEvent(data, req, config)
        
        // Update last webhook received timestamp
        await req.payload.updateGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
          data: {
            broadcastSettings: {
              ...(settings?.broadcastSettings || {}),
              lastWebhookReceived: new Date().toISOString(),
              webhookStatus: 'verified',
            },
          },
        })
        
        // Acknowledge receipt
        return Response.json({ success: true }, { status: 200 })
      } catch (error) {
        console.error('[Broadcast Webhook] Error processing webhook:', error)
        
        // Return 200 to prevent retries even on error
        return Response.json({ success: false }, { status: 200 })
      }
    }
  }
}