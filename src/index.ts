import type { Config } from 'payload'
import type { NewsletterPluginConfig } from './types'
import { createSubscribersCollection } from './collections/Subscribers'
import { createEmailSettingsGlobal } from './globals/EmailSettings'
import { createEmailService } from './providers'
import { createNewsletterEndpoints } from './endpoints'

// Extend Payload type to include our email service
declare module 'payload' {
  export interface Payload {
    newsletterEmailService?: any
  }
}

export const newsletterPlugin = (pluginConfig: NewsletterPluginConfig) => (incomingConfig: Config): Config => {
  // Validate and set defaults
  const config: NewsletterPluginConfig = {
    enabled: true,
    subscribersSlug: 'subscribers',
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

  // Create subscribers collection
  const subscribersCollection = createSubscribersCollection(config)

  // Create email settings global
  const emailSettingsGlobal = createEmailSettingsGlobal(config)

  // Build collections array
  let collections = [...(incomingConfig.collections || []), subscribersCollection]

  // Extend articles collection if newsletter scheduling is enabled
  if (config.features?.newsletterScheduling?.enabled) {
    const articlesCollection = config.features.newsletterScheduling.articlesCollection || 'articles'
    
    collections = collections.map(collection => {
      if (collection.slug === articlesCollection) {
        // TODO: Add newsletter scheduling fields
        return collection
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
      emailSettingsGlobal,
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
          slug: 'newsletter-settings',
          depth: 0,
        })

        if (settings) {
          const emailConfig = {
            provider: settings.provider || config.providers.default,
            fromAddress: settings.fromAddress || config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: settings.fromName || config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            replyTo: settings.replyTo,
            resend: settings.provider === 'resend' ? {
              apiKey: settings.resendSettings?.apiKey || config.providers.resend?.apiKey || '',
              audienceIds: settings.resendSettings?.audienceIds?.reduce((acc, item) => {
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

          payload.newsletterEmailService = createEmailService(emailConfig)
        } else {
          // Use config defaults
          const emailConfig = {
            provider: config.providers.default,
            fromAddress: config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            resend: config.providers.resend,
            broadcast: config.providers.broadcast,
          }

          payload.newsletterEmailService = createEmailService(emailConfig)
        }

        console.log('Newsletter plugin initialized with', payload.newsletterEmailService.getProvider(), 'provider')
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