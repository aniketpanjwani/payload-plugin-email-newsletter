import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { createSubscribeEndpoint } from './subscribe'
import { createVerifyMagicLinkEndpoint } from './verify-magic-link'
import { createPreferencesEndpoint, createUpdatePreferencesEndpoint } from './preferences'
import { createUnsubscribeEndpoint } from './unsubscribe'

export function createNewsletterEndpoints(
  config: NewsletterPluginConfig
): Endpoint[] {
  const endpoints: Endpoint[] = [
    createSubscribeEndpoint(config),
    createUnsubscribeEndpoint(config),
  ]

  // Add auth endpoints if enabled
  if (config.auth?.enabled !== false) {
    endpoints.push(
      createVerifyMagicLinkEndpoint(config),
      createPreferencesEndpoint(config),
      createUpdatePreferencesEndpoint(config)
    )
  }

  return endpoints
}