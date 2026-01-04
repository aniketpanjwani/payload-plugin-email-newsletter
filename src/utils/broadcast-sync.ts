import type { PayloadRequest } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig, BroadcastProviderConfig } from '../types'
import type { ProviderCreateData, ProviderSyncResult, AudienceIdField } from '../types/broadcast'
import { convertToEmailSafeHtml } from './emailSafeHtml'
import { populateMediaFields } from '../endpoints/broadcasts/preview'
import { getErrorMessage } from './getErrorMessage'

/**
 * Document shape for checking sync eligibility
 */
interface SyncEligibleDocument {
  subject?: string | null
  contentSection?: {
    content?: unknown
  } | null
}

/**
 * Document shape for building provider create data
 */
interface ProviderDocumentData {
  subject: string
  contentSection?: {
    content?: unknown
    preheader?: string
  }
  settings?: {
    trackOpens?: boolean
    trackClicks?: boolean
    replyTo?: string
  }
  audienceIds?: AudienceIdField[]
}

/**
 * Provider interface for creating broadcasts
 */
interface BroadcastProvider {
  create: (data: ProviderCreateData) => Promise<{ id: string; providerData?: unknown }>
}

/**
 * Check if a broadcast has sufficient content for provider sync.
 * Requires both subject and content to be present.
 */
export function shouldSyncToProvider(doc: SyncEligibleDocument): boolean {
  return Boolean(doc.subject && doc.contentSection?.content)
}

/**
 * Build the data object required for creating a broadcast in the provider.
 * Handles HTML conversion and media population.
 */
export async function buildProviderCreateData(
  doc: ProviderDocumentData,
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig,
  providerConfig: BroadcastProviderConfig | null
): Promise<ProviderCreateData> {
  const populatedContent = await populateMediaFields(
    doc.contentSection?.content,
    req.payload,
    pluginConfig
  ) as SerializedEditorState | null

  const htmlContent = await convertToEmailSafeHtml(populatedContent, {
    wrapInTemplate: pluginConfig.customizations?.broadcasts?.emailPreview?.wrapInTemplate ?? true,
    customWrapper: pluginConfig.customizations?.broadcasts?.emailPreview?.customWrapper,
    preheader: doc.contentSection?.preheader,
    subject: doc.subject,
    documentData: doc,
    customBlockConverter: pluginConfig.customizations?.broadcasts?.customBlockConverter
  })

  return {
    name: doc.subject,
    subject: doc.subject,
    preheader: doc.contentSection?.preheader || '',
    content: htmlContent,
    trackOpens: doc.settings?.trackOpens ?? true,
    trackClicks: doc.settings?.trackClicks ?? true,
    replyTo: doc.settings?.replyTo || providerConfig?.replyTo,
    audienceIds: doc.audienceIds?.map((a) => a.audienceId) || [],
  }
}

/**
 * Sync a broadcast to the provider (create operation).
 * Returns success with IDs or failure with error message.
 *
 * This function handles errors gracefully and returns a result object
 * rather than throwing, allowing callers to decide how to handle failures.
 */
export async function syncBroadcastToProvider(
  doc: ProviderDocumentData,
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig,
  providerConfig: BroadcastProviderConfig | null,
  provider: BroadcastProvider
): Promise<ProviderSyncResult> {
  try {
    const createData = await buildProviderCreateData(doc, req, pluginConfig, providerConfig)
    const providerBroadcast = await provider.create(createData)

    return {
      success: true,
      providerId: providerBroadcast.id,
      externalId: providerBroadcast.id,
      providerData: providerBroadcast.providerData,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}
