import type { TaskConfig, PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../types/index'

export const createUnsubscribeSyncJob = (
  pluginConfig: NewsletterPluginConfig
): TaskConfig => {
  return {
    slug: 'sync-unsubscribes',
    label: 'Sync Unsubscribes from Email Service',
    handler: async ({ req }: { req: PayloadRequest }) => {
      const subscribersSlug = pluginConfig.subscribersSlug || 'subscribers'
      const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
      
      if (!emailService) {
        console.error('Email service not configured')
        return {
          output: {
            syncedCount: 0
          }
        }
      }

      let syncedCount = 0
      
      try {
        // For Broadcast: Poll all subscribers
        if (emailService.getProvider() === 'broadcast') {
          console.warn('Starting Broadcast unsubscribe sync...')
          
          // Get Broadcast configuration
          const broadcastConfig = pluginConfig.providers?.broadcast
          if (!broadcastConfig) {
            throw new Error('Broadcast configuration not found')
          }

          const apiUrl = broadcastConfig.apiUrl.replace(/\/$/, '')
          const token = broadcastConfig.token

          let page = 1
          let hasMore = true

          while (hasMore) {
            // Fetch subscribers from Broadcast
            const response = await fetch(
              `${apiUrl}/api/v1/subscribers.json?page=${page}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            )

            if (!response.ok) {
              throw new Error(`Broadcast API error: ${response.status}`)
            }

            const data = await response.json()
            const broadcastSubscribers = data.subscribers || []
            
            // Process each subscriber
            for (const broadcastSub of broadcastSubscribers) {
              // Find corresponding subscriber in Payload
              const payloadSubscribers = await req.payload.find({
                collection: subscribersSlug,
                where: {
                  email: {
                    equals: broadcastSub.email,
                  },
                },
                limit: 1,
              })

              if (payloadSubscribers.docs.length > 0) {
                const payloadSub = payloadSubscribers.docs[0]
                
                // Check if unsubscribe status differs
                const broadcastUnsubscribed = !broadcastSub.is_active || broadcastSub.unsubscribed_at
                const payloadUnsubscribed = payloadSub.subscriptionStatus === 'unsubscribed'
                
                if (broadcastUnsubscribed && !payloadUnsubscribed) {
                  // Update Payload subscriber to unsubscribed
                  await req.payload.update({
                    collection: subscribersSlug,
                    id: payloadSub.id,
                    data: {
                      subscriptionStatus: 'unsubscribed',
                      unsubscribedAt: broadcastSub.unsubscribed_at || new Date().toISOString(),
                    },
                  })
                  syncedCount++
                  console.warn(`Unsubscribed: ${broadcastSub.email}`)
                }
              }
            }

            // Check pagination
            if (data.pagination && data.pagination.current < data.pagination.total_pages) {
              page++
            } else {
              hasMore = false
            }
          }

          console.warn(`Broadcast sync complete. Unsubscribed ${syncedCount} contacts.`)
        }

        // For Resend: Use Audiences API
        if (emailService.getProvider() === 'resend') {
          console.warn('Starting Resend unsubscribe sync...')
          
          // Note: Resend webhooks are preferred over polling
          // This is a fallback polling implementation
          
          // First, get all audiences
          const resendConfig = pluginConfig.providers?.resend
          if (!resendConfig) {
            throw new Error('Resend configuration not found')
          }

          // You would need to implement audience/contact polling here
          // Resend's API structure would require:
          // 1. List audiences
          // 2. For each audience, list contacts
          // 3. Check unsubscribed status
          
          console.warn('Resend polling implementation needed - webhooks recommended')
        }

        // Custom after sync hook
        if (pluginConfig.hooks?.afterUnsubscribeSync) {
          await pluginConfig.hooks.afterUnsubscribeSync({ 
            req, 
            syncedCount: syncedCount
          })
        }

      } catch (error) {
        console.error('Unsubscribe sync error:', error)
        throw error
      }
      
      return {
        output: {
          syncedCount
        }
      }
    },
  }
}