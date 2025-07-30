import type { Endpoint } from 'payload'
import type { NewsletterPluginConfig } from '../../types'

export const createBroadcastManagementEndpoints = (
  _config: NewsletterPluginConfig
): Endpoint[] => {
  // Broadcast endpoints are now added directly to the broadcasts collection
  // This function is kept for backward compatibility but returns empty array
  return []
}