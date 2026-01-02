import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig } from '../../types'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'
import { populateMediaFields } from '../../utils/mediaPopulation'

// Re-export for backwards compatibility
export { populateMediaFields } from '../../utils/mediaPopulation'

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
        const { content, preheader, subject, documentData } = data

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

        // Populate media fields in custom blocks before conversion
        req.payload.logger?.info('Populating media fields for email preview...')
        const populatedContent = await populateMediaFields(content, req.payload, config)

        // Get email preview customization options
        const emailPreviewConfig = config.customizations?.broadcasts?.emailPreview
        
        // Convert content to email-safe HTML with customization options
        const htmlContent = await convertToEmailSafeHtml(populatedContent as SerializedEditorState | null, {
          wrapInTemplate: emailPreviewConfig?.wrapInTemplate ?? true,
          preheader: preheader,
          subject: subject,
          mediaUrl: mediaUrl,
          documentData, // Pass all document data
          customBlockConverter: config.customizations?.broadcasts?.customBlockConverter,
          customWrapper: emailPreviewConfig?.customWrapper,
        })

        return Response.json({
          success: true,
          html: htmlContent,
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