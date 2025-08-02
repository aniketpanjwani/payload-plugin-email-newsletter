import type { Endpoint, PayloadHandler, PayloadRequest, Payload } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'

// Helper function to recursively find and populate media fields in content
export async function populateMediaFields(content: any, payload: Payload, config: NewsletterPluginConfig): Promise<any> {
  if (!content || typeof content !== 'object') return content
  
  // Handle Lexical editor state
  if (content.root?.children) {
    for (const child of content.root.children) {
      await populateBlockMediaFields(child, payload, config)
    }
  }
  
  return content
}

// Helper function to populate media fields in individual blocks
async function populateBlockMediaFields(node: any, payload: Payload, config: NewsletterPluginConfig): Promise<void> {
  // Check if this is a block node
  if (node.type === 'block' && node.fields) {
    const blockType = node.fields.blockType || node.fields.blockName
    
    // Get custom blocks configuration
    const customBlocks = config.customizations?.broadcasts?.customBlocks || []
    const blockConfig = customBlocks.find((b: any) => b.slug === blockType)
    
    if (blockConfig && blockConfig.fields) {
      // Find all upload fields in the block
      for (const field of blockConfig.fields) {
        if (field.type === 'upload' && field.relationTo && node.fields[field.name]) {
          const fieldValue = node.fields[field.name]
          
          // If it's just an ID string, populate it
          if (typeof fieldValue === 'string' && fieldValue.match(/^[a-f0-9]{24}$/i)) {
            try {
              const media = await payload.findByID({
                collection: field.relationTo,
                id: fieldValue,
                depth: 0,
              })
              
              if (media) {
                node.fields[field.name] = media
                payload.logger?.info(`Populated ${field.name} for block ${blockType}:`, {
                  mediaId: fieldValue,
                  mediaUrl: media.url,
                  filename: media.filename
                })
              }
            } catch (error) {
              payload.logger?.error(`Failed to populate ${field.name} for block ${blockType}:`, error)
            }
          }
        }
        
        // Also handle arrays of uploads
        if (field.type === 'array' && field.fields) {
          const arrayValue = node.fields[field.name]
          if (Array.isArray(arrayValue)) {
            for (const arrayItem of arrayValue) {
              if (arrayItem && typeof arrayItem === 'object') {
                // Recursively process array items for upload fields
                for (const arrayField of field.fields) {
                  if (arrayField.type === 'upload' && arrayField.relationTo && arrayItem[arrayField.name]) {
                    const arrayFieldValue = arrayItem[arrayField.name]
                    
                    if (typeof arrayFieldValue === 'string' && arrayFieldValue.match(/^[a-f0-9]{24}$/i)) {
                      try {
                        const media = await payload.findByID({
                          collection: arrayField.relationTo,
                          id: arrayFieldValue,
                          depth: 0,
                        })
                        
                        if (media) {
                          arrayItem[arrayField.name] = media
                          payload.logger?.info(`Populated array ${arrayField.name} for block ${blockType}:`, {
                            mediaId: arrayFieldValue,
                            mediaUrl: media.url,
                            filename: media.filename
                          })
                        }
                      } catch (error) {
                        payload.logger?.error(`Failed to populate array ${arrayField.name} for block ${blockType}:`, error)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      await populateBlockMediaFields(child, payload, config)
    }
  }
}

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
        const htmlContent = await convertToEmailSafeHtml(populatedContent, {
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