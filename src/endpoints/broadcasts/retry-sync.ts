import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig } from '../../types'
import { requireAdmin } from '../../utils/auth'
import { getBroadcastProvider } from '../../utils/getProvider'
import { getBroadcastConfig } from '../../utils/getBroadcastConfig'
import { BroadcastProviderError } from '../../types/broadcast'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'
import { populateMediaFields } from './preview'
import { getErrorMessage } from '../../utils/getErrorMessage'

/**
 * Create endpoint to retry syncing a broadcast with the provider.
 * POST /api/broadcasts/:id/retry-sync
 *
 * This endpoint allows users to manually retry syncing a broadcast
 * when the automatic sync has failed.
 */
export const createRetrySyncEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => {
  return {
    path: '/:id/retry-sync',
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

        // Get ID from URL
        const url = new URL(req.url || '', `http://localhost`)
        const pathParts = url.pathname.split('/')
        const id = pathParts[pathParts.length - 2] // -2 because last part is 'retry-sync'

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

        if (!broadcastDoc) {
          return Response.json({
            success: false,
            error: 'Broadcast not found',
          }, { status: 404 })
        }

        // Get provider
        const provider = await getBroadcastProvider(req, config)
        const providerConfig = await getBroadcastConfig(req, config)

        // If no providerId, create the broadcast in provider
        if (!broadcastDoc.providerId) {
          if (!broadcastDoc.subject || !broadcastDoc.contentSection?.content) {
            return Response.json({
              success: false,
              error: 'Broadcast must have subject and content to sync',
            }, { status: 400 })
          }

          // Convert content to HTML
          const htmlContent = await convertToEmailSafeHtml(
            await populateMediaFields(broadcastDoc.contentSection.content, req.payload, config) as SerializedEditorState | null,
            {
              wrapInTemplate: config.customizations?.broadcasts?.emailPreview?.wrapInTemplate ?? true,
              customWrapper: config.customizations?.broadcasts?.emailPreview?.customWrapper,
              preheader: broadcastDoc.contentSection?.preheader,
              subject: broadcastDoc.subject,
              documentData: broadcastDoc,
              customBlockConverter: config.customizations?.broadcasts?.customBlockConverter
            }
          )

          const createData = {
            name: broadcastDoc.subject,
            subject: broadcastDoc.subject,
            preheader: broadcastDoc.contentSection?.preheader || '',
            content: htmlContent,
            trackOpens: broadcastDoc.settings?.trackOpens ?? true,
            trackClicks: broadcastDoc.settings?.trackClicks ?? true,
            replyTo: broadcastDoc.settings?.replyTo || providerConfig?.replyTo,
            audienceIds: broadcastDoc.audienceIds?.map((a: any) => a.audienceId) || [],
          }

          const providerBroadcast = await provider.create(createData)

          // Update document with provider ID and sync status
          await req.payload.update({
            collection: collectionSlug,
            id,
            data: {
              providerId: providerBroadcast.id,
              externalId: providerBroadcast.id,
              providerData: providerBroadcast.providerData,
              providerSyncStatus: 'synced',
              providerSyncError: null,
              lastSyncAttempt: new Date().toISOString(),
            },
            user: auth.user,
          })

          return Response.json({
            success: true,
            message: 'Broadcast created and synced with provider',
          })
        }

        // If has providerId, update the broadcast in provider
        const populatedContent = await populateMediaFields(
          broadcastDoc.contentSection?.content,
          req.payload,
          config
        ) as SerializedEditorState | null

        const emailPreviewConfig = config.customizations?.broadcasts?.emailPreview

        const htmlContent = await convertToEmailSafeHtml(populatedContent, {
          wrapInTemplate: emailPreviewConfig?.wrapInTemplate ?? true,
          customWrapper: emailPreviewConfig?.customWrapper,
          preheader: broadcastDoc.contentSection?.preheader,
          subject: broadcastDoc.subject,
          documentData: broadcastDoc,
          customBlockConverter: config.customizations?.broadcasts?.customBlockConverter
        })

        const updates = {
          name: broadcastDoc.subject,
          subject: broadcastDoc.subject,
          preheader: broadcastDoc.contentSection?.preheader,
          content: htmlContent,
          trackOpens: broadcastDoc.settings?.trackOpens,
          trackClicks: broadcastDoc.settings?.trackClicks,
          replyTo: broadcastDoc.settings?.replyTo || providerConfig?.replyTo,
          audienceIds: broadcastDoc.audienceIds?.map((a: any) => a.audienceId),
        }

        await provider.update(broadcastDoc.providerId as string, updates)

        // Update sync status
        await req.payload.update({
          collection: collectionSlug,
          id,
          data: {
            providerSyncStatus: 'synced',
            providerSyncError: null,
            lastSyncAttempt: new Date().toISOString(),
          },
          user: auth.user,
        })

        return Response.json({
          success: true,
          message: 'Broadcast synced with provider successfully',
        })
      } catch (error) {
        console.error('Failed to retry sync:', error)

        // Try to update sync status to failed
        try {
          const url = new URL(req.url || '', `http://localhost`)
          const pathParts = url.pathname.split('/')
          const id = pathParts[pathParts.length - 2]

          if (id) {
            await req.payload.update({
              collection: collectionSlug,
              id,
              data: {
                providerSyncStatus: 'failed',
                providerSyncError: getErrorMessage(error),
                lastSyncAttempt: new Date().toISOString(),
              },
            })
          }
        } catch {
          // Ignore update error
        }

        if (error instanceof BroadcastProviderError) {
          return Response.json({
            success: false,
            error: error.message,
            code: error.code,
          }, { status: 500 })
        }

        return Response.json({
          success: false,
          error: getErrorMessage(error),
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}
