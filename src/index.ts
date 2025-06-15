import type { Config } from 'payload'
import type { NewsletterPluginConfig } from './types'

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

  // TODO: Implement plugin logic
  // - Create subscribers collection
  // - Create email settings global
  // - Set up email service
  // - Add API endpoints
  // - Extend articles collection if newsletter scheduling is enabled

  return incomingConfig
}

export { newsletterPlugin as default }