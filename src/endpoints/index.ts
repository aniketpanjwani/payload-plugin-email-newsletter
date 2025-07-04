import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { createSubscribeEndpoint } from './subscribe'
import { createVerifyMagicLinkEndpoint } from './verify-magic-link'
import { createPreferencesEndpoint, createUpdatePreferencesEndpoint } from './preferences'
import { createUnsubscribeEndpoint } from './unsubscribe'
import { createSigninEndpoint } from './signin'
import { createMeEndpoint } from './me'
import { createSignoutEndpoint } from './signout'
import { createBroadcastManagementEndpoints } from './broadcasts'

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
      createUpdatePreferencesEndpoint(config),
      createSigninEndpoint(config),
      createMeEndpoint(config),
      createSignoutEndpoint(config)
    )
  }

  // Add broadcast management endpoints if enabled
  endpoints.push(...createBroadcastManagementEndpoints(config))

  return endpoints
}