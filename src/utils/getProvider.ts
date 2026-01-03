import type { PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { getBroadcastConfig } from './getBroadcastConfig'
import { BroadcastProviderError, BroadcastErrorCode } from '../types/broadcast'

/**
 * Get an initialized Broadcast API provider instance.
 * Centralizes provider initialization to reduce duplication across hooks and endpoints.
 *
 * @param req - Payload request object
 * @param pluginConfig - Newsletter plugin configuration
 * @returns Initialized BroadcastApiProvider instance
 * @throws BroadcastProviderError if provider is not configured
 */
export async function getBroadcastProvider(
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig
) {
  const config = await getBroadcastConfig(req, pluginConfig)

  if (!config?.token) {
    throw new BroadcastProviderError(
      'Broadcast provider not configured. Check Newsletter Settings or environment variables.',
      BroadcastErrorCode.CONFIGURATION_ERROR,
      'broadcast'
    )
  }

  const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
  return new BroadcastApiProvider(config)
}
