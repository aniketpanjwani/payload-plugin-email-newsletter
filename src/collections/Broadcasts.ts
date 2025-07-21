import type { CollectionConfig } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { BroadcastStatus } from '../types'
import { createEmailContentField } from '../fields/emailContent'
import { createBroadcastInlinePreviewField } from '../fields/broadcastInlinePreview'
import { convertToEmailSafeHtml } from '../utils/emailSafeHtml'

export const createBroadcastsCollection = (pluginConfig: NewsletterPluginConfig): CollectionConfig => {
  const hasProviders = !!(pluginConfig.providers?.broadcast || pluginConfig.providers?.resend)

  return {
    slug: 'broadcasts',
    labels: {
      singular: 'Broadcast',
      plural: 'Broadcasts',
    },
    admin: {
      useAsTitle: 'subject',
      description: 'Individual email campaigns sent to subscribers',
      defaultColumns: ['subject', 'status', 'sentAt', 'recipientCount', 'actions'],
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
      {
        name: 'preheader',
        type: 'text',
        admin: {
          description: 'Preview text shown in email clients'
        },
      },
      createEmailContentField({
        admin: {
          description: 'Email content',
        },
      }),
      createBroadcastInlinePreviewField(),
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
      // UI Field for custom actions in list view
      {
        name: 'actions',
        type: 'ui',
        admin: {
          components: {
            Cell: 'payload-plugin-newsletter/components#ActionsCell',
            Field: 'payload-plugin-newsletter/components#EmptyField',
          },
          disableListColumn: false,
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
            const htmlContent = await convertToEmailSafeHtml(doc.content)

            // Create broadcast in provider
            const providerBroadcast = await provider.create({
              name: doc.subject, // Use subject as name since we removed the name field
              subject: doc.subject,
              preheader: doc.preheader,
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
            if (data.preheader !== originalDoc.preheader) updates.preheader = data.preheader
            if (data.content !== originalDoc.content) {
              updates.content = await convertToEmailSafeHtml(data.content)
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


