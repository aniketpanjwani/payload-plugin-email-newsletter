import type { CollectionConfig } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig } from '../types'
import { BroadcastStatus } from '../types'
import { createEmailContentField, createEmailLexicalEditor } from '../fields/emailContent'
import { createBroadcastInlinePreviewField } from '../fields/broadcastInlinePreview'
import { convertToEmailSafeHtml } from '../utils/emailSafeHtml'
import { getBroadcastConfig } from '../utils/getBroadcastConfig'
import { createSendBroadcastEndpoint } from '../endpoints/broadcasts/send'
import { createScheduleBroadcastEndpoint } from '../endpoints/broadcasts/schedule'
import { createTestBroadcastEndpoint } from '../endpoints/broadcasts/test'
import { createBroadcastPreviewEndpoint, populateMediaFields } from '../endpoints/broadcasts/preview'

export const createBroadcastsCollection = (pluginConfig: NewsletterPluginConfig): CollectionConfig => {
  const hasProviders = !!(pluginConfig.providers?.broadcast || pluginConfig.providers?.resend)
  const customizations = pluginConfig.customizations?.broadcasts

  const collectionSlug = 'broadcasts'

  return {
    slug: collectionSlug,
    access: {
      read: () => true, // Public read access
      create: ({ req: { user } }) => {
        // Allow authenticated users to create
        return Boolean(user)
      },
      update: ({ req: { user } }) => {
        // Allow authenticated users to update
        return Boolean(user)
      },
      delete: ({ req: { user } }) => {
        // Allow authenticated users to delete
        return Boolean(user)
      },
    },
    versions: {
      drafts: {
        autosave: true,
        schedulePublish: true,
      }
    },
    labels: {
      singular: 'Broadcast',
      plural: 'Broadcasts',
    },
    admin: {
      useAsTitle: 'subject',
      description: 'Individual email campaigns sent to subscribers',
      defaultColumns: ['subject', '_status', 'sendStatus', 'sentAt', 'recipientCount'],
    },
    endpoints: [
      createSendBroadcastEndpoint(pluginConfig, collectionSlug),
      createScheduleBroadcastEndpoint(pluginConfig, collectionSlug),
      createTestBroadcastEndpoint(pluginConfig, collectionSlug),
      createBroadcastPreviewEndpoint(pluginConfig, collectionSlug),
    ],
    fields: [
      {
        name: 'subject',
        type: 'text',
        required: true,
        admin: {
          description: 'Email subject line'
        },
      },
      // Add any additional fields from customizations after subject
      ...(customizations?.additionalFields || []),
      {
        type: 'row',
        fields: [
          {
            name: 'contentSection',
            type: 'group',
            label: false,
            admin: {
              width: '50%',
              style: {
                paddingRight: '1rem',
              },
            },
            fields: [
              {
                name: 'preheader',
                type: 'text',
                admin: {
                  description: 'Preview text shown in email clients'
                },
              },
              // Apply content field customization if provided
              // Process blocks server-side to avoid client serialization issues
              (() => {
                // Create email editor with custom blocks processed server-side
                const emailEditor = createEmailLexicalEditor(customizations?.customBlocks)
                
                // Create base field with pre-processed editor
                const baseField = createEmailContentField({
                  admin: { description: 'Email content' },
                  editor: emailEditor
                })
                
                // Apply field overrides if provided
                return customizations?.fieldOverrides?.content
                  ? customizations.fieldOverrides.content(baseField)
                  : baseField
              })(),
            ],
          },
          {
            name: 'previewSection',
            type: 'group',
            label: false,
            admin: {
              width: '50%',
            },
            fields: [
              createBroadcastInlinePreviewField(),
            ],
          },
        ],
      },
      {
        name: 'sendStatus',
        type: 'select',
        label: 'Send Status',
        required: true,
        defaultValue: BroadcastStatus.DRAFT,
        options: [
          { label: 'Draft', value: BroadcastStatus.DRAFT },
          { label: 'Scheduled', value: BroadcastStatus.SCHEDULED },
          { label: 'Sending', value: BroadcastStatus.SENDING },
          { label: 'Sent', value: BroadcastStatus.SENT },
          { label: 'Failed', value: BroadcastStatus.FAILED },
          { label: 'Paused', value: BroadcastStatus.PAUSED },
          { label: 'Canceled', value: BroadcastStatus.CANCELED },
        ],
        admin: {
          readOnly: true,
          description: 'The status of the email send operation',
          components: {
            Cell: 'payload-plugin-newsletter/components#StatusBadge',
          },
        },
      },
      {
        name: 'settings',
        type: 'group',
        fields: [
          {
            name: 'trackOpens',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track when recipients open this email'
            },
          },
          {
            name: 'trackClicks',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track when recipients click links'
            },
          },
          {
            name: 'replyTo',
            type: 'email',
            admin: {
              description: 'Override the channel reply-to address for this broadcast'
            },
          },
        ],
      },
      {
        name: 'audienceIds',
        type: 'array',
        fields: [
          {
            name: 'audienceId',
            type: 'text',
            required: true,
          },
        ],
        admin: {
          description: 'Target specific audience segments',
          condition: () => {
            // Only show if the provider supports segmentation
            return hasProviders
          },
        },
      },
      {
        name: 'analytics',
        type: 'group',
        admin: {
          readOnly: true,
          condition: (data) => data?.sendStatus === BroadcastStatus.SENT,
        },
        fields: [
          {
            name: 'recipientCount',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'sent',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'delivered',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'opened',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'clicked',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'bounced',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'complained',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'unsubscribed',
            type: 'number',
            defaultValue: 0,
          },
        ],
      },
      {
        name: 'sentAt',
        type: 'date',
        admin: {
          readOnly: true,
          date: {
            displayFormat: 'MMM d, yyyy h:mm a',
          },
        },
      },
      {
        name: 'scheduledAt',
        type: 'date',
        admin: {
          condition: (data) => data?.sendStatus === BroadcastStatus.SCHEDULED,
          date: {
            displayFormat: 'MMM d, yyyy h:mm a',
          },
        },
      },
      {
        name: 'providerId',
        type: 'text',
        admin: {
          readOnly: true,
          description: 'ID from the email provider',
          condition: (data) => hasProviders && data?.providerId,
        },
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          readOnly: true,
          description: 'External ID for webhook integration',
        },
      },
      {
        name: 'providerData',
        type: 'json',
        admin: {
          readOnly: true,
          condition: () => false, // Hidden by default
        },
      },
      // Webhook tracking fields
      {
        name: 'webhookData',
        type: 'group',
        label: 'Webhook Data',
        admin: {
          condition: () => false, // Hidden by default, used for webhook tracking
        },
        fields: [
          {
            name: 'lastWebhookEvent',
            type: 'text',
            admin: {
              readOnly: true,
            },
          },
          {
            name: 'lastWebhookEventAt',
            type: 'date',
            admin: {
              readOnly: true,
            },
          },
          {
            name: 'hasWarnings',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'failureReason',
            type: 'text',
          },
          {
            name: 'sentCount',
            type: 'number',
          },
          {
            name: 'totalCount',
            type: 'number',
          },
          {
            name: 'failedCount',
            type: 'number',
          },
          {
            name: 'remainingCount',
            type: 'number',
          },
          {
            name: 'sendingStartedAt',
            type: 'date',
          },
          {
            name: 'failedAt',
            type: 'date',
          },
          {
            name: 'abortedAt',
            type: 'date',
          },
          {
            name: 'abortReason',
            type: 'text',
          },
          {
            name: 'pausedAt',
            type: 'date',
          },
          {
            name: 'webhookEvents',
            type: 'array',
            label: 'Webhook Event Log',
            maxRows: 10,
            admin: {
              readOnly: true,
              description: 'Recent webhook events for debugging',
            },
            fields: [
              {
                name: 'eventType',
                type: 'text',
                admin: { readOnly: true },
              },
              {
                name: 'receivedAt',
                type: 'date',
                admin: { readOnly: true },
              },
              {
                name: 'eventPayload',
                type: 'json',
                admin: { readOnly: true },
              },
            ],
          },
        ],
      },
    ],
    hooks: {
      // Sync with provider on create and update
      afterChange: [
        async ({ doc, operation, req, previousDoc }) => {
          if (!hasProviders) return doc

          // Skip create operation - we'll handle provider creation on first update
          if (operation === 'create') {
            req.payload.logger.info('Broadcast created in Payload, provider sync will happen on first update with content')
            return doc
          }
          
          // Handle update operation
          if (operation === 'update') {
            req.payload.logger.info({
              operation,
              hasProviderId: !!doc.providerId,
              hasExternalId: !!doc.externalId,
              sendStatus: doc.sendStatus,
              publishStatus: doc._status,
              hasSubject: !!doc.subject,
              hasContent: !!doc.contentSection?.content
            }, 'Broadcast afterChange update hook triggered')

            try {
              // Get provider config from settings first, then fall back to env vars
              const providerConfig = await getBroadcastConfig(req, pluginConfig)
              if (!providerConfig || !providerConfig.token) {
                req.payload.logger.error('Broadcast provider not configured in Newsletter Settings or environment variables')
                return doc
              }

              const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
              const provider = new BroadcastApiProvider(providerConfig)

              // If no providerId/externalId and has enough content, create in provider
              if (!doc.providerId && !doc.externalId && doc.subject && doc.contentSection?.content) {
                req.payload.logger.info('Creating broadcast in provider on first update with content')
                
                const htmlContent = await convertToEmailSafeHtml(
                  await populateMediaFields(doc.contentSection.content, req.payload, pluginConfig) as SerializedEditorState | null,
                  {
                    wrapInTemplate: pluginConfig.customizations?.broadcasts?.emailPreview?.wrapInTemplate ?? true,
                    customWrapper: pluginConfig.customizations?.broadcasts?.emailPreview?.customWrapper,
                    preheader: doc.contentSection?.preheader,
                    subject: doc.subject,
                    documentData: doc,
                    customBlockConverter: pluginConfig.customizations?.broadcasts?.customBlockConverter
                  }
                )

                const createData = {
                  name: doc.subject,
                  subject: doc.subject,
                  preheader: doc.contentSection?.preheader || '',
                  content: htmlContent,
                  trackOpens: doc.settings?.trackOpens ?? true,
                  trackClicks: doc.settings?.trackClicks ?? true,
                  replyTo: doc.settings?.replyTo || providerConfig.replyTo,
                  audienceIds: doc.audienceIds?.map((a: any) => a.audienceId) || [],
                }

                const providerBroadcast = await provider.create(createData)
                
                req.payload.logger.info(`Broadcast ${doc.id} created in provider with ID ${providerBroadcast.id}`)
                
                // Return the document with provider IDs
                return {
                  ...doc,
                  providerId: providerBroadcast.id,
                  externalId: providerBroadcast.id,
                  providerData: providerBroadcast.providerData,
                }
              }

              // If no providerId, skip sync
              if (!doc.providerId) {
                req.payload.logger.info(`Broadcast ${doc.id} has no providerId and insufficient content for creation - skipping sync`)
                return doc
              }

              // Handle normal updates to existing broadcasts (only if providerId exists)
              if (doc.providerId) {
                // Only sync if broadcast is still editable
                const capabilities = provider.getCapabilities()
                const sendStatus = doc.sendStatus || BroadcastStatus.DRAFT
                if (!capabilities.editableStatuses.includes(sendStatus)) {
                  req.payload.logger.info(`Skipping sync for broadcast in status: ${sendStatus}`)
                  return doc
                }

                // Check what has changed
                const contentChanged = 
                  doc.subject !== previousDoc?.subject ||
                  doc.contentSection?.preheader !== previousDoc?.contentSection?.preheader ||
                  JSON.stringify(doc.contentSection?.content) !== JSON.stringify(previousDoc?.contentSection?.content) ||
                  doc.settings?.trackOpens !== previousDoc?.settings?.trackOpens ||
                  doc.settings?.trackClicks !== previousDoc?.settings?.trackClicks ||
                  doc.settings?.replyTo !== previousDoc?.settings?.replyTo ||
                  JSON.stringify(doc.audienceIds) !== JSON.stringify(previousDoc?.audienceIds)

                if (contentChanged) {
                  // Build update data
                  const updates: any = {}
                  if (doc.subject !== previousDoc?.subject) {
                    updates.name = doc.subject // Use subject as name in the provider
                    updates.subject = doc.subject
                  }
                  if (doc.contentSection?.preheader !== previousDoc?.contentSection?.preheader) {
                    updates.preheader = doc.contentSection?.preheader
                  }
                  if (JSON.stringify(doc.contentSection?.content) !== JSON.stringify(previousDoc?.contentSection?.content)) {
                    const populatedContent = await populateMediaFields(doc.contentSection?.content, req.payload, pluginConfig) as SerializedEditorState | null

                    // Get email preview customization options
                    const emailPreviewConfig = pluginConfig.customizations?.broadcasts?.emailPreview

                    updates.content = await convertToEmailSafeHtml(populatedContent, {
                      wrapInTemplate: emailPreviewConfig?.wrapInTemplate ?? true,
                      customWrapper: emailPreviewConfig?.customWrapper,
                      preheader: doc.contentSection?.preheader,
                      subject: doc.subject,
                      documentData: doc, // Pass entire document
                      customBlockConverter: pluginConfig.customizations?.broadcasts?.customBlockConverter
                    })
                  }
                  if (doc.settings?.trackOpens !== previousDoc?.settings?.trackOpens) {
                    updates.trackOpens = doc.settings.trackOpens
                  }
                  if (doc.settings?.trackClicks !== previousDoc?.settings?.trackClicks) {
                    updates.trackClicks = doc.settings.trackClicks
                  }
                  if (doc.settings?.replyTo !== previousDoc?.settings?.replyTo) {
                    updates.replyTo = doc.settings.replyTo || providerConfig.replyTo
                  }
                  if (JSON.stringify(doc.audienceIds) !== JSON.stringify(previousDoc?.audienceIds)) {
                    updates.audienceIds = doc.audienceIds?.map((a: any) => a.audienceId)
                  }

                  req.payload.logger.info({
                    providerId: doc.providerId,
                    updates
                  }, 'Syncing broadcast updates to provider')
                  
                  await provider.update(doc.providerId, updates)
                  req.payload.logger.info(`Broadcast ${doc.id} synced to provider successfully`)
                } else {
                  req.payload.logger.info('No content changes to sync to provider')
                }
              }
            } catch (error) {
              // Enhanced error logging for debugging
              req.payload.logger.error('Raw error from broadcast update operation:')
              req.payload.logger.error(error)
              
              if (error instanceof Error) {
                req.payload.logger.error('Error is instance of Error:', {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                  ...(error as any).details,
                  ...(error as any).response,
                  ...(error as any).data,
                  ...(error as any).status,
                  ...(error as any).statusText,
                })
              } else if (typeof error === 'string') {
                req.payload.logger.error({ errorValue: error }, 'Error is a string')
              } else if (error && typeof error === 'object') {
                req.payload.logger.error({ errorValue: JSON.stringify(error, null, 2) }, 'Error is an object')
              } else {
                req.payload.logger.error({ errorType: typeof error }, 'Unknown error type')
              }

              req.payload.logger.error({
                id: doc.id,
                subject: doc.subject,
                hasContent: !!doc.contentSection?.content,
                contentType: doc.contentSection?.content ? typeof doc.contentSection.content : 'none',
              }, 'Failed broadcast document (update operation)')
              
              // Don't throw - allow Payload update to succeed even if provider sync fails
            }
          }

          return doc
        },
        // Hook to send when published
        async ({ doc, operation, previousDoc, req }) => {
          // Only run on updates when transitioning to published
          if (operation !== 'update') return doc
          
          const wasUnpublished = !previousDoc?._status || previousDoc._status === 'draft'
          const isNowPublished = doc._status === 'published'
          
          if (wasUnpublished && isNowPublished && doc.providerId) {
            // Check if already sent
            if (doc.sendStatus === BroadcastStatus.SENT || doc.sendStatus === BroadcastStatus.SENDING) {
              return doc
            }
            
            try {
              // Get provider config from settings first, then fall back to env vars
              const broadcastConfig = await getBroadcastConfig(req, pluginConfig)
              const resendConfig = pluginConfig.providers?.resend // TODO: Add getResendConfig utility
              
              if (!broadcastConfig && !resendConfig) {
                req.payload.logger.error('No provider configured for sending in Newsletter Settings or environment variables')
                return doc
              }
              
              // Send via provider
              if (broadcastConfig && broadcastConfig.token) {
                const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
                const provider = new BroadcastApiProvider(broadcastConfig)
                await provider.send(doc.providerId)
              }
              // Add resend provider support here when needed
              
              // Update status
              await req.payload.update({
                collection: 'broadcasts',
                id: doc.id,
                data: {
                  sendStatus: BroadcastStatus.SENDING,
                  sentAt: new Date().toISOString(),
                },
                req,
              })
              
              req.payload.logger.info(`Broadcast ${doc.id} sent successfully`)
              
            } catch (error) {
              // Log full error details for debugging
              if (error instanceof Error) {
                req.payload.logger.error(`Failed to send broadcast ${doc.id}:`, {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                  // If it's a BroadcastProviderError, it might have additional details
                  ...(error as any).details
                })
              } else {
                req.payload.logger.error({ error: String(error) }, `Failed to send broadcast ${doc.id}`)
              }
              
              // Update status to failed
              await req.payload.update({
                collection: 'broadcasts',
                id: doc.id,
                data: {
                  sendStatus: BroadcastStatus.FAILED,
                },
                req,
              })
            }
          }
          
          return doc
        },
      ],
      // beforeChange hooks can be added here if needed
      beforeChange: [],
      // Handle deletion
      afterDelete: [
        async ({ doc, req }) => {
          if (!hasProviders || !doc?.providerId) return doc

          try {
            // Get provider config from settings first, then fall back to env vars
            const providerConfig = await getBroadcastConfig(req, pluginConfig)
            if (!providerConfig || !providerConfig.token) {
              req.payload.logger.error('Broadcast provider not configured in Newsletter Settings or environment variables')
              return doc
            }

            const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
            const provider = new BroadcastApiProvider(providerConfig)

            // Only delete if broadcast is still editable
            const capabilities = provider.getCapabilities()
            if (capabilities.editableStatuses.includes(doc.sendStatus)) {
              await provider.delete(doc.providerId)
            }
          } catch (error) {
            // Log full error details for debugging
            if (error instanceof Error) {
              req.payload.logger.error('Failed to delete broadcast from provider:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                // If it's a BroadcastProviderError, it might have additional details
                ...(error as any).details
              })
            } else {
              req.payload.logger.error({ error: String(error) }, 'Failed to delete broadcast from provider')
            }
          }

          return doc
        },
      ],
    },
  }
}


