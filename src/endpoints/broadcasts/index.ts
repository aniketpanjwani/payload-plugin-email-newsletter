import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { createSendBroadcastEndpoint } from './send'
import { createScheduleBroadcastEndpoint } from './schedule'
import { createTestBroadcastEndpoint } from './test'
import { createBroadcastPreviewEndpoint } from './preview'

export const createBroadcastManagementEndpoints = (
  config: NewsletterPluginConfig
): Endpoint[] => {
  // Broadcast endpoints are now added directly to the broadcasts collection
  // This function is kept for backward compatibility but returns empty array
  return []
}