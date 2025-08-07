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
import { createBroadcastWebhookEndpoint } from './webhooks/broadcast'
import { createWebhookVerifyEndpoint } from './webhooks/verify'

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
  
  // Add webhook endpoints for Broadcast provider
  if (config.providers?.broadcast) {
    endpoints.push(
      createBroadcastWebhookEndpoint(config),
      createWebhookVerifyEndpoint(config)
    )
  }

  return endpoints
}