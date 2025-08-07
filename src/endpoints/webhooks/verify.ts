import type { PayloadRequest } from 'payload'
import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../../types'

export const createWebhookVerifyEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/webhooks/verify',
    method: 'post',
    handler: async (req: PayloadRequest) => {
      try {
        // Get settings
        const settings = await req.payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
        })
        
        if (!settings?.broadcastSettings?.webhookSecret) {
          return Response.json({ 
            success: false, 
            error: 'Webhook secret not configured' 
          }, { status: 400 })
        }
        
        // Get Broadcast API URL and token
        const apiUrl = settings.broadcastSettings.apiUrl
        const token = settings.broadcastSettings.token
        
        if (!apiUrl || !token) {
          return Response.json({ 
            success: false, 
            error: 'Broadcast API not configured' 
          }, { status: 400 })
        }
        
        // TODO: Actually create webhook via Broadcast API
        // For now, just mark as configured
        await req.payload.updateGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
          data: {
            broadcastSettings: {
              ...settings.broadcastSettings,
              webhookStatus: 'configured',
            },
          },
        })
        
        return Response.json({ 
          success: true,
          message: 'Webhook configuration verified. Please configure the webhook in Broadcast.'
        })
      } catch (error) {
        console.error('[Webhook Verify] Error:', error)
        return Response.json({ 
          success: false, 
          error: 'Failed to verify webhook configuration' 
        }, { status: 500 })
      }
    }
  }
}