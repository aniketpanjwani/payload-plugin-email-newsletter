import type { Config } from 'payload'
import type { NewsletterPluginConfig } from './types'
import { createSubscribersCollection } from './collections/Subscribers'
import { createEmailSettingsGlobal } from './globals/EmailSettings'

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

  // Build the modified config
  const modifiedConfig: Config = {
    ...incomingConfig,
    collections,
    globals: [
      ...(incomingConfig.globals || []),
      emailSettingsGlobal,
    ],
    // TODO: Add endpoints
    // TODO: Add onInit hook for email service initialization
  }

  return modifiedConfig
}

export { newsletterPlugin as default }