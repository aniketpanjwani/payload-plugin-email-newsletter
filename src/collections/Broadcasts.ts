import type { CollectionConfig } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { BroadcastStatus } from '../types'
import { createEmailContentField, createEmailLexicalEditor } from '../fields/emailContent'
import { createBroadcastInlinePreviewField } from '../fields/broadcastInlinePreview'
import { convertToEmailSafeHtml } from '../utils/emailSafeHtml'

export const createBroadcastsCollection = (pluginConfig: NewsletterPluginConfig): CollectionConfig => {
  const hasProviders = !!(pluginConfig.providers?.broadcast || pluginConfig.providers?.resend)
  const customizations = pluginConfig.customizations?.broadcasts

  return {
    slug: 'broadcasts',
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
      defaultColumns: ['subject', '_status', 'status', 'sentAt', 'recipientCount'],
    },
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
        name: 'status',
        type: 'select',
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
          condition: (data) => data?.status === BroadcastStatus.SENT,
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
          condition: (data) => data?.status === BroadcastStatus.SCHEDULED,
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
        name: 'providerData',
        type: 'json',
        admin: {
          readOnly: true,
          condition: () => false, // Hidden by default
        },
      },
    ],
    hooks: {
      // Sync with provider on create
      afterChange: [
        async ({ doc, operation, req }) => {
          if (!hasProviders || operation !== 'create') return doc

          try {
            // Get provider from config
            const providerConfig = pluginConfig.providers?.broadcast
            if (!providerConfig) {
              req.payload.logger.error('Broadcast provider not configured')
              return doc
            }

            const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
            const provider = new BroadcastApiProvider(providerConfig)

            // Convert rich text to HTML
            const htmlContent = await convertToEmailSafeHtml(doc.contentSection?.content)

            // Create broadcast in provider
            const providerBroadcast = await provider.create({
              name: doc.subject, // Use subject as name since we removed the name field
              subject: doc.subject,
              preheader: doc.contentSection?.preheader,
              content: htmlContent,
              trackOpens: doc.settings?.trackOpens,
              trackClicks: doc.settings?.trackClicks,
              replyTo: doc.settings?.replyTo || providerConfig.replyTo,
              audienceIds: doc.audienceIds?.map((a: any) => a.audienceId),
            })

            // Update with provider ID
            await req.payload.update({
              collection: 'broadcasts',
              id: doc.id,
              data: {
                providerId: providerBroadcast.id,
                providerData: providerBroadcast.providerData,
              },
              req,
            })

            return {
              ...doc,
              providerId: providerBroadcast.id,
              providerData: providerBroadcast.providerData,
            }
          } catch (error) {
            req.payload.logger.error('Failed to create broadcast in provider:', error)
            return doc
          }
        },
        // Hook to send when published
        async ({ doc, operation, previousDoc, req }) => {
          // Only run on updates when transitioning to published
          if (operation !== 'update') return doc
          
          const wasUnpublished = !previousDoc?._status || previousDoc._status === 'draft'
          const isNowPublished = doc._status === 'published'
          
          if (wasUnpublished && isNowPublished && doc.providerId) {
            // Check if already sent
            if (doc.status === 'sent' || doc.status === 'sending') {
              return doc
            }
            
            try {
              const broadcastConfig = pluginConfig.providers?.broadcast
              const resendConfig = pluginConfig.providers?.resend
              
              if (!broadcastConfig && !resendConfig) {
                req.payload.logger.error('No provider configured for sending')
                return doc
              }
              
              // Send via provider
              if (broadcastConfig) {
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
                  status: BroadcastStatus.SENDING,
                  sentAt: new Date().toISOString(),
                },
                req,
              })
              
              req.payload.logger.info(`Broadcast ${doc.id} sent successfully`)
              
            } catch (error) {
              req.payload.logger.error(`Failed to send broadcast ${doc.id}:`, error)
              
              // Update status to failed
              await req.payload.update({
                collection: 'broadcasts',
                id: doc.id,
                data: {
                  status: BroadcastStatus.FAILED,
                },
                req,
              })
            }
          }
          
          return doc
        },
      ],
      // Sync updates with provider
      beforeChange: [
        async ({ data, originalDoc, operation, req }) => {
          if (!hasProviders || !originalDoc?.providerId || operation !== 'update') return data

          try {
            // Get provider from config
            const providerConfig = pluginConfig.providers?.broadcast
            if (!providerConfig) {
              req.payload.logger.error('Broadcast provider not configured')
              return data
            }

            const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
            const provider = new BroadcastApiProvider(providerConfig)

            // Only sync if broadcast is still editable
            const capabilities = provider.getCapabilities()
            if (!capabilities.editableStatuses.includes(originalDoc.status)) {
              return data
            }

            // Build update data
            const updates: any = {}
            if (data.subject !== originalDoc.subject) {
              updates.name = data.subject // Use subject as name in the provider
              updates.subject = data.subject
            }
            if (data.contentSection?.preheader !== originalDoc.contentSection?.preheader) updates.preheader = data.contentSection?.preheader
            if (data.contentSection?.content !== originalDoc.contentSection?.content) {
              updates.content = await convertToEmailSafeHtml(data.contentSection?.content)
            }
            if (data.settings?.trackOpens !== originalDoc.settings?.trackOpens) {
              updates.trackOpens = data.settings.trackOpens
            }
            if (data.settings?.trackClicks !== originalDoc.settings?.trackClicks) {
              updates.trackClicks = data.settings.trackClicks
            }
            if (data.settings?.replyTo !== originalDoc.settings?.replyTo) {
              updates.replyTo = data.settings.replyTo || providerConfig.replyTo
            }
            if (JSON.stringify(data.audienceIds) !== JSON.stringify(originalDoc.audienceIds)) {
              updates.audienceIds = data.audienceIds?.map((a: any) => a.audienceId)
            }

            if (Object.keys(updates).length > 0) {
              await provider.update(originalDoc.providerId, updates)
            }
          } catch (error) {
            req.payload.logger.error('Failed to update broadcast in provider:', error)
            // Continue with local update even if provider fails
          }

          return data
        },
      ],
      // Handle deletion
      afterDelete: [
        async ({ doc, req }) => {
          if (!hasProviders || !doc?.providerId) return doc

          try {
            // Get provider from config
            const providerConfig = pluginConfig.providers?.broadcast
            if (!providerConfig) {
              req.payload.logger.error('Broadcast provider not configured')
              return doc
            }

            const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
            const provider = new BroadcastApiProvider(providerConfig)

            // Only delete if broadcast is still editable
            const capabilities = provider.getCapabilities()
            if (capabilities.editableStatuses.includes(doc.status)) {
              await provider.delete(doc.providerId)
            }
          } catch (error) {
            req.payload.logger.error('Failed to delete broadcast from provider:', error)
          }

          return doc
        },
      ],
    },
  }
}


