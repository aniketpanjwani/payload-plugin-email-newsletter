import type { PayloadRequest } from 'payload'
import type { NewsletterPluginConfig, BroadcastProviderConfig } from '../types'

const BROADCAST_CONFIG_CACHE_KEY = 'broadcastConfig'

export async function getBroadcastConfig(
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig
): Promise<BroadcastProviderConfig | null> {
  // Check request context cache first to avoid duplicate database queries
  const cached = req.context?.[BROADCAST_CONFIG_CACHE_KEY] as BroadcastProviderConfig | null | undefined
  if (cached !== undefined) {
    return cached
  }

  try {
    // Get settings from Newsletter Settings collection
    const settings = await req.payload.findGlobal({
      slug: pluginConfig.settingsSlug || 'newsletter-settings',
      req,
    })

    // Build provider config from settings, falling back to env vars
    let result: BroadcastProviderConfig | null = null

    if (settings?.provider === 'broadcast' && settings?.broadcastSettings) {
      result = {
        apiUrl: settings.broadcastSettings.apiUrl || pluginConfig.providers?.broadcast?.apiUrl || '',
        token: settings.broadcastSettings.token || pluginConfig.providers?.broadcast?.token || '',
        fromAddress: settings.fromAddress || pluginConfig.providers?.broadcast?.fromAddress || '',
        fromName: settings.fromName || pluginConfig.providers?.broadcast?.fromName || '',
        replyTo: settings.replyTo || pluginConfig.providers?.broadcast?.replyTo,
      }
    } else {
      // Fall back to env var config
      result = pluginConfig.providers?.broadcast || null
    }

    // Cache in request context for subsequent calls
    if (req.context) {
      req.context[BROADCAST_CONFIG_CACHE_KEY] = result
    }

    return result
  } catch (error) {
    req.payload.logger.error({ error: String(error) }, 'Failed to get broadcast config from settings')
    // Fall back to env var config on error
    const fallback = pluginConfig.providers?.broadcast || null

    // Cache the fallback too
    if (req.context) {
      req.context[BROADCAST_CONFIG_CACHE_KEY] = fallback
    }

    return fallback
  }
}