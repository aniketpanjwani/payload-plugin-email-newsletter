import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { NewsletterPluginConfig, SendBroadcastOptions } from '../../types'
import { NewsletterProviderError, NewsletterStatus } from '../../types'
import { requireAdmin } from '../../utils/auth'

export const createSendBroadcastEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => {
  return {
    path: `/${collectionSlug}/:id/send`,
    method: 'post',
    handler: (async (req: PayloadRequest) => {
      try {
        // Check authentication
        const auth = await requireAdmin(req, config)
        if (!auth.authorized) {
          return Response.json({
            success: false,
            error: auth.error,
          }, { status: 401 })
        }

        // Check if broadcast management is enabled
        if (!config.features?.newsletterManagement?.enabled) {
          return Response.json({
            success: false,
            error: 'Broadcast management is not enabled',
          }, { status: 400 })
        }

        // Get ID from URL
        const url = new URL(req.url || '', `http://localhost`)
        const pathParts = url.pathname.split('/')
        const id = pathParts[pathParts.length - 2] // -2 because last part is 'send'

        if (!id) {
          return Response.json({
            success: false,
            error: 'Broadcast ID is required',
          }, { status: 400 })
        }

        // Parse request body
        const data = await (req.json?.() || Promise.resolve({})) as SendBroadcastOptions

        // Get the broadcast document
        const broadcastDoc = await req.payload.findByID({
          collection: collectionSlug,
          id,
          user: auth.user,
        })

        if (!broadcastDoc || !broadcastDoc.providerId) {
          return Response.json({
            success: false,
            error: 'Broadcast not found or not synced with provider',
          }, { status: 404 })
        }

        // Get provider from config
        const providerConfig = config.providers?.broadcast
        if (!providerConfig) {
          return Response.json({
            success: false,
            error: 'Broadcast provider not configured',
          }, { status: 500 })
        }

        const { BroadcastApiProvider } = await import('../../providers/broadcast/broadcast')
        const provider = new BroadcastApiProvider(providerConfig)

        // Send broadcast using provider ID
        const broadcast = await provider.send(broadcastDoc.providerId, data)

        // Update status in Payload collection
        await req.payload.update({
          collection: collectionSlug,
          id,
          data: {
            status: NewsletterStatus.SENDING,
            sentAt: new Date().toISOString(),
          },
          user: auth.user,
        })

        return Response.json({
          success: true,
          message: 'Broadcast sent successfully',
          broadcast,
        })
      } catch (error) {
        console.error('Failed to send broadcast:', error)
        
        if (error instanceof NewsletterProviderError) {
          return Response.json({
            success: false,
            error: error.message,
            code: error.code,
          }, { status: error.code === 'NOT_SUPPORTED' ? 501 : 500 })
        }

        return Response.json({
          success: false,
          error: 'Failed to send broadcast',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}