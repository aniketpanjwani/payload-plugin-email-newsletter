import type { PayloadRequest } from 'payload'
import type { NewsletterPluginConfig, BroadcastProviderConfig } from '../types'

export async function getBroadcastConfig(
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig
): Promise<BroadcastProviderConfig | null> {
  try {
    // Get settings from Newsletter Settings collection
    const settings = await req.payload.findGlobal({
      slug: pluginConfig.settingsSlug || 'newsletter-settings',
      req,
    })

    // Build provider config from settings, falling back to env vars
    if (settings?.provider === 'broadcast' && settings?.broadcastSettings) {
      return {
        apiUrl: settings.broadcastSettings.apiUrl || pluginConfig.providers?.broadcast?.apiUrl || '',
        token: settings.broadcastSettings.token || pluginConfig.providers?.broadcast?.token || '',
        fromAddress: settings.fromAddress || pluginConfig.providers?.broadcast?.fromAddress || '',
        fromName: settings.fromName || pluginConfig.providers?.broadcast?.fromName || '',
        replyTo: settings.replyTo || pluginConfig.providers?.broadcast?.replyTo,
      }
    }

    // Fall back to env var config
    return pluginConfig.providers?.broadcast || null
  } catch (error) {
    req.payload.logger.error('Failed to get broadcast config from settings:', error)
    // Fall back to env var config on error
    return pluginConfig.providers?.broadcast || null
  }
}