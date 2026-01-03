import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { NewsletterProviderError, NewsletterStatus } from '../../types'
import { requireAdmin } from '../../utils/auth'
import { getBroadcastProvider } from '../../utils/getProvider'
import { BroadcastProviderError } from '../../types/broadcast'
import { scheduledState, draftState } from '../../utils/scheduling-state'

export const createScheduleBroadcastEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => {
  return {
    path: '/:id/schedule',
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
        const id = pathParts[pathParts.length - 2] // -2 because last part is 'schedule'

        if (!id) {
          return Response.json({
            success: false,
            error: 'Broadcast ID is required',
          }, { status: 400 })
        }

        // Parse request body
        const data = await (req.json?.() || Promise.resolve({}))
        const { scheduledAt } = data

        if (!scheduledAt) {
          return Response.json({
            success: false,
            error: 'scheduledAt is required',
          }, { status: 400 })
        }

        // Parse and validate date
        const scheduledDate = new Date(scheduledAt)
        if (isNaN(scheduledDate.getTime())) {
          return Response.json({
            success: false,
            error: 'Invalid scheduledAt date',
          }, { status: 400 })
        }

        // Ensure scheduled date is in the future
        if (scheduledDate <= new Date()) {
          return Response.json({
            success: false,
            error: 'scheduledAt must be in the future',
          }, { status: 400 })
        }

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

        // Get provider (centralized initialization)
        const provider = await getBroadcastProvider(req, config)

        // Schedule broadcast using provider ID
        const broadcast = await provider.schedule(broadcastDoc.providerId, scheduledDate)

        // Update status in Payload collection
        await req.payload.update({
          collection: collectionSlug,
          id,
          data: scheduledState(scheduledDate),
          user: auth.user,
        })

        return Response.json({
          success: true,
          message: `Broadcast scheduled for ${scheduledDate.toISOString()}`,
          broadcast,
        })
      } catch (error) {
        console.error('Failed to schedule broadcast:', error)

        if (error instanceof BroadcastProviderError) {
          return Response.json({
            success: false,
            error: error.message,
            code: error.code,
          }, { status: error.code === 'CONFIGURATION_ERROR' ? 500 : 500 })
        }

        if (error instanceof NewsletterProviderError) {
          return Response.json({
            success: false,
            error: error.message,
            code: error.code,
          }, { status: error.code === 'NOT_SUPPORTED' ? 501 : 500 })
        }

        return Response.json({
          success: false,
          error: 'Failed to schedule broadcast',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}

/**
 * Create endpoint to cancel a scheduled broadcast.
 * DELETE /api/broadcasts/:id/schedule
 */
export const createCancelScheduleBroadcastEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => {
  return {
    path: '/:id/schedule',
    method: 'delete',
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
        const id = pathParts[pathParts.length - 2] // -2 because last part is 'schedule'

        if (!id) {
          return Response.json({
            success: false,
            error: 'Broadcast ID is required',
          }, { status: 400 })
        }

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

        // Verify broadcast is currently scheduled
        if (broadcastDoc.sendStatus !== NewsletterStatus.SCHEDULED) {
          return Response.json({
            success: false,
            error: `Cannot cancel: broadcast is not scheduled (current status: ${broadcastDoc.sendStatus})`,
          }, { status: 400 })
        }

        // Get provider and cancel schedule
        const provider = await getBroadcastProvider(req, config)
        await provider.cancelSchedule(broadcastDoc.providerId as string)

        // Update status in Payload collection
        await req.payload.update({
          collection: collectionSlug,
          id,
          data: draftState(),
          user: auth.user,
        })

        return Response.json({
          success: true,
          message: 'Broadcast schedule cancelled',
        })
      } catch (error) {
        console.error('Failed to cancel scheduled broadcast:', error)

        if (error instanceof NewsletterProviderError) {
          return Response.json({
            success: false,
            error: error.message,
            code: error.code,
          }, { status: error.code === 'NOT_SUPPORTED' ? 501 : 500 })
        }

        return Response.json({
          success: false,
          error: 'Failed to cancel scheduled broadcast',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}