import type { CollectionConfig } from 'payload'
import type { NewsletterPluginConfig } from '../types'

export const createChannelsCollection = (pluginConfig: NewsletterPluginConfig): CollectionConfig => {
  const hasProviders = !!(pluginConfig.providers?.broadcast || pluginConfig.providers?.resend)

  return {
    slug: 'channels',
    labels: {
      singular: 'Channel',
      plural: 'Channels',
    },
    admin: {
      useAsTitle: 'name',
      description: 'Newsletter channels/publications that can send broadcasts',
      defaultColumns: ['name', 'fromEmail', 'subscriberCount', 'active'],
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        admin: {
          description: 'The name of this newsletter channel'
        },
      },
      {
        name: 'description',
        type: 'textarea',
        admin: {
          description: 'A brief description of what this channel is about'
        },
      },
      {
        name: 'fromName',
        type: 'text',
        required: true,
        admin: {
          description: 'The sender name that appears in emails'
        },
      },
      {
        name: 'fromEmail',
        type: 'email',
        required: true,
        admin: {
          description: 'The sender email address'
        },
      },
      {
        name: 'replyTo',
        type: 'email',
        admin: {
          description: 'Reply-to email address (optional)'
        },
      },
      {
        name: 'providerType',
        type: 'select',
        required: true,
        options: [
          ...(pluginConfig.providers?.broadcast ? [{ label: 'Broadcast', value: 'broadcast' }] : []),
          ...(pluginConfig.providers?.resend ? [{ label: 'Resend', value: 'resend' }] : []),
        ],
        admin: {
          description: 'Which email provider manages this channel'
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
        name: 'subscriberCount',
        type: 'number',
        admin: {
          readOnly: true,
          description: 'Number of active subscribers',
        },
        defaultValue: 0,
      },
      {
        name: 'active',
        type: 'checkbox',
        defaultValue: true,
        admin: {
          description: 'Whether this channel is currently active'
        },
      },
      {
        name: 'settings',
        type: 'group',
        fields: [
          {
            name: 'defaultTrackOpens',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track email opens by default for broadcasts in this channel'
            },
          },
          {
            name: 'defaultTrackClicks',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track link clicks by default for broadcasts in this channel'
            },
          },
          {
            name: 'requireDoubleOptIn',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              description: 'Require double opt-in for new subscribers'
            },
          },
        ],
      },
    ],
    hooks: {
      // Sync with provider on create
      afterChange: [
        async ({ doc, operation, req }) => {
          if (!hasProviders || operation !== 'create') return doc

          try {
            const provider = await getProvider(doc.providerType, pluginConfig)
            if (!provider) return doc

            // Create channel in provider
            const providerChannel = await provider.createChannel({
              name: doc.name,
              description: doc.description,
              fromName: doc.fromName,
              fromEmail: doc.fromEmail,
              replyTo: doc.replyTo,
            })

            // Update with provider ID
            await req.payload.update({
              collection: 'channels',
              id: doc.id,
              data: {
                providerId: providerChannel.id,
                subscriberCount: providerChannel.subscriberCount || 0,
              },
              req,
            })

            return {
              ...doc,
              providerId: providerChannel.id,
              subscriberCount: providerChannel.subscriberCount || 0,
            }
          } catch (error) {
            req.payload.logger.error('Failed to create channel in provider:', error)
            return doc
          }
        },
      ],
      // Sync updates with provider
      beforeChange: [
        async ({ data, originalDoc, operation, req }) => {
          if (!hasProviders || !originalDoc?.providerId || operation !== 'update') return data

          try {
            const provider = await getProvider(originalDoc.providerType, pluginConfig)
            if (!provider) return data

            // Check what fields changed
            const updates: any = {}
            if (data.name !== originalDoc.name) updates.name = data.name
            if (data.description !== originalDoc.description) updates.description = data.description
            if (data.fromName !== originalDoc.fromName) updates.fromName = data.fromName
            if (data.fromEmail !== originalDoc.fromEmail) updates.fromEmail = data.fromEmail
            if (data.replyTo !== originalDoc.replyTo) updates.replyTo = data.replyTo

            if (Object.keys(updates).length > 0) {
              await provider.updateChannel(originalDoc.providerId, updates)
            }
          } catch (error) {
            req.payload.logger.error('Failed to update channel in provider:', error)
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
            const provider = await getProvider(doc.providerType, pluginConfig)
            if (!provider) return doc

            await provider.deleteChannel(doc.providerId)
          } catch (error) {
            req.payload.logger.error('Failed to delete channel from provider:', error)
          }

          return doc
        },
      ],
    },
  }
}

// Helper to get provider instance
async function getProvider(providerType: string, config: NewsletterPluginConfig): Promise<any> {
  if (providerType === 'broadcast') {
    const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
    const providerConfig = config.providers?.broadcast
    return providerConfig ? new BroadcastApiProvider(providerConfig) : null
  }
  
  if (providerType === 'resend') {
    const { ResendBroadcastProvider } = await import('../providers/resend/broadcast')
    const providerConfig = config.providers?.resend
    return providerConfig ? new ResendBroadcastProvider(providerConfig) : null
  }

  return null
}