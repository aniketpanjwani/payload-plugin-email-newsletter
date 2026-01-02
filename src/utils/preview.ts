import type { Payload } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig } from '../types'
import { populateMediaFields } from './mediaPopulation'
import { convertToEmailSafeHtml } from './emailSafeHtml'

/**
 * Options for generating broadcast preview HTML
 */
export interface PreviewOptions {
  /** Email subject line */
  subject: string
  /** Email preheader text (preview text in inbox) */
  preheader?: string
  /** Whether to wrap content in email template (default: true) */
  wrapInTemplate?: boolean
  /** Base URL for media files (optional, derived from payload.config.serverURL if not provided) */
  mediaUrl?: string
  /** Additional document data to pass to custom wrapper */
  documentData?: Record<string, unknown>
}

/**
 * Result from preview generation
 */
export interface PreviewResult {
  /** Generated HTML content */
  html: string
  /** Subject line used */
  subject: string
  /** Preheader text used (null if not provided) */
  preheader: string | null
}

/**
 * Generates preview HTML from broadcast content.
 *
 * This utility handles the full preview generation pipeline:
 * 1. Populates media fields (resolves Media IDs to full objects with URLs)
 * 2. Converts Lexical content to email-safe HTML
 * 3. Optionally wraps in email template
 *
 * @param content - Lexical editor state content from broadcast
 * @param payload - Payload instance for database queries
 * @param config - Newsletter plugin configuration
 * @param options - Preview generation options
 * @returns Preview result with HTML, subject, and preheader
 *
 * @example
 * ```typescript
 * import { generateBroadcastPreviewHtml } from 'payload-plugin-newsletter'
 *
 * const preview = await generateBroadcastPreviewHtml(
 *   broadcast.content,
 *   payload,
 *   pluginConfig,
 *   {
 *     subject: broadcast.subject,
 *     preheader: broadcast.preheader,
 *     wrapInTemplate: true,
 *   }
 * )
 *
 * // preview.html contains the rendered email HTML
 * ```
 */
export async function generateBroadcastPreviewHtml(
  content: SerializedEditorState | null | undefined,
  payload: Payload,
  config: NewsletterPluginConfig,
  options: PreviewOptions
): Promise<PreviewResult> {
  // Derive media URL from payload config if not provided
  const mediaUrl =
    options.mediaUrl ??
    (payload.config.serverURL ? `${payload.config.serverURL}/api/media` : '/api/media')

  // Get email preview customization options from config
  const emailPreviewConfig = config.customizations?.broadcasts?.emailPreview

  // Step 1: Populate media fields in content
  payload.logger?.info('Populating media fields for preview generation...')
  const populatedContent = await populateMediaFields(content, payload, config)

  // Step 2: Convert to email-safe HTML
  const html = await convertToEmailSafeHtml(populatedContent as SerializedEditorState | null, {
    wrapInTemplate: options.wrapInTemplate ?? emailPreviewConfig?.wrapInTemplate ?? true,
    preheader: options.preheader,
    subject: options.subject,
    mediaUrl,
    documentData: options.documentData,
    customBlockConverter: config.customizations?.broadcasts?.customBlockConverter,
    customWrapper: emailPreviewConfig?.customWrapper,
  })

  return {
    html,
    subject: options.subject,
    preheader: options.preheader ?? null,
  }
}
