import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { createSendBroadcastEndpoint } from './send'
import { createScheduleBroadcastEndpoint } from './schedule'
import { createTestBroadcastEndpoint } from './test'

export const createBroadcastManagementEndpoints = (
  config: NewsletterPluginConfig
): Endpoint[] => {
  // Only create endpoints if broadcast management is enabled
  if (!config.features?.newsletterManagement?.enabled) {
    return []
  }

  // Only create custom action endpoints
  // CRUD operations are handled by Payload's automatic REST API
  const collectionSlug = config.features.newsletterManagement.collections?.broadcasts || 'broadcasts'
  
  return [
    createSendBroadcastEndpoint(config, collectionSlug),
    createScheduleBroadcastEndpoint(config, collectionSlug),
    createTestBroadcastEndpoint(config, collectionSlug),
  ]
}