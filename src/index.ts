import type { Config } from 'payload'
import type { NewsletterPluginConfig } from './types'
import { createSubscribersCollection } from './collections/Subscribers'
import { createNewsletterSettingsGlobal } from './globals/NewsletterSettings'
import { createEmailService } from './providers'
import { createNewsletterEndpoints } from './endpoints'
import { createNewsletterSchedulingFields } from './fields/newsletterScheduling'

// Extend Payload type to include our email service
declare module 'payload' {
  interface BasePayload {
    newsletterEmailService?: any
  }
}

export const newsletterPlugin = (pluginConfig: NewsletterPluginConfig) => (incomingConfig: Config): Config => {
  // Validate and set defaults
  const config: NewsletterPluginConfig = {
    enabled: true,
    subscribersSlug: 'subscribers',
    settingsSlug: 'newsletter-settings',
    auth: {
      enabled: true,
      tokenExpiration: '7d',
      magicLinkPath: '/newsletter/verify',
      ...pluginConfig.auth,
    },
    ...pluginConfig,
  }

  // If plugin is disabled, return config unchanged
  if (!config.enabled) {
    return incomingConfig
  }

  // Create plugin collections and globals
  const subscribersCollection = createSubscribersCollection(config)
  const settingsGlobal = createNewsletterSettingsGlobal(config)

  // Build collections array
  let collections = [...(incomingConfig.collections || []), subscribersCollection]

  // Extend collections with newsletter scheduling fields if enabled
  if (config.features?.newsletterScheduling?.enabled) {
    const targetCollections = config.features.newsletterScheduling.collections || 'articles'
    const collectionsToExtend = Array.isArray(targetCollections) ? targetCollections : [targetCollections]
    const schedulingFields = createNewsletterSchedulingFields(config)
    
    collections = collections.map(collection => {
      if (collectionsToExtend.includes(collection.slug)) {
        return {
          ...collection,
          fields: [
            ...collection.fields,
            ...schedulingFields,
          ],
        }
      }
      return collection
    })
  }

  // Create API endpoints
  const endpoints = createNewsletterEndpoints(config)

  // Build the modified config
  const modifiedConfig: Config = {
    ...incomingConfig,
    collections,
    globals: [
      ...(incomingConfig.globals || []),
      settingsGlobal,
    ],
    endpoints: [
      ...(incomingConfig.endpoints || []),
      ...endpoints,
    ],
    onInit: async (payload) => {
      // Initialize email service
      try {
        // Get settings from global
        const settings = await payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
        })

        let emailServiceConfig: any
        
        if (settings) {
          emailServiceConfig = {
            provider: settings.provider || config.providers.default,
            fromAddress: settings.fromAddress || config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: settings.fromName || config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            replyTo: settings.replyTo,
            resend: settings.provider === 'resend' ? {
              apiKey: settings.resendSettings?.apiKey || config.providers.resend?.apiKey || '',
              audienceIds: settings.resendSettings?.audienceIds?.reduce((acc: any, item: any) => {
                acc[item.locale] = {
                  production: item.production,
                  development: item.development,
                }
                return acc
              }, {}) || config.providers.resend?.audienceIds,
            } : config.providers.resend,
            broadcast: settings.provider === 'broadcast' ? {
              apiUrl: settings.broadcastSettings?.apiUrl || config.providers.broadcast?.apiUrl || '',
              tokens: {
                production: settings.broadcastSettings?.productionToken || config.providers.broadcast?.tokens.production,
                development: settings.broadcastSettings?.developmentToken || config.providers.broadcast?.tokens.development,
              },
            } : config.providers.broadcast,
          }
        } else {
          // Use config defaults
          emailServiceConfig = {
            provider: config.providers.default,
            fromAddress: config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            resend: config.providers.resend,
            broadcast: config.providers.broadcast,
          }
        }

        (payload as any).newsletterEmailService = createEmailService(emailServiceConfig)

        console.warn('Newsletter plugin initialized with', (payload as any).newsletterEmailService.getProvider(), 'provider')
      } catch (error) {
        console.error('Failed to initialize newsletter email service:', error)
      }

      // Call original onInit if it exists
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }
    },
  }

  return modifiedConfig
}

export { newsletterPlugin as default }

// Export session utilities
export * from './utilities/session'