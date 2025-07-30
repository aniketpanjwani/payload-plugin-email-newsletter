import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'

export const createBroadcastPreviewEndpoint = (
  config: NewsletterPluginConfig,
  _collectionSlug: string
): Endpoint => {
  return {
    path: '/preview',
    method: 'post',
    handler: (async (req: PayloadRequest) => {
      try {
        // Parse request body
        const data = await (req.json?.() || Promise.resolve({}))
        const { content, preheader, subject } = data

        if (!content) {
          return Response.json({
            success: false,
            error: 'Content is required for preview',
          }, { status: 400 })
        }

        // Get media URL from payload config or use default
        const mediaUrl = req.payload.config.serverURL 
          ? `${req.payload.config.serverURL}/api/media`
          : '/api/media'

        // Convert content to email-safe HTML with custom block converter
        const htmlContent = await convertToEmailSafeHtml(content, {
          wrapInTemplate: true,
          preheader: preheader,
          mediaUrl: mediaUrl,
          customBlockConverter: config.customizations?.broadcasts?.customBlockConverter,
        })

        return Response.json({
          success: true,
          preview: {
            subject: subject || 'Preview',
            preheader: preheader || '',
            html: htmlContent,
          },
        })
      } catch (error) {
        console.error('Failed to generate email preview:', error)
        
        return Response.json({
          success: false,
          error: 'Failed to generate email preview',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}