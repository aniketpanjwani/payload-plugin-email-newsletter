import type { PayloadRequest } from 'payload'
import type { NewsletterPluginConfig, ResendProviderConfig } from '../types'

export async function getResendConfig(
  req: PayloadRequest,
  pluginConfig: NewsletterPluginConfig
): Promise<ResendProviderConfig | null> {
  try {
    // Get settings from Newsletter Settings collection
    const settings = await req.payload.findGlobal({
      slug: pluginConfig.settingsSlug || 'newsletter-settings',
      req,
    })

    // Build provider config from settings, falling back to env vars
    if (settings?.provider === 'resend' && settings?.resendSettings) {
      return {
        apiKey: settings.resendSettings.apiKey || pluginConfig.providers?.resend?.apiKey || '',
        fromAddress: settings.fromAddress || pluginConfig.providers?.resend?.fromAddress || '',
        fromName: settings.fromName || pluginConfig.providers?.resend?.fromName || '',
        audienceIds: settings.resendSettings.audienceIds || pluginConfig.providers?.resend?.audienceIds,
      }
    }

    // Fall back to env var config
    return pluginConfig.providers?.resend || null
  } catch (error) {
    req.payload.logger.error('Failed to get resend config from settings:', error)
    // Fall back to env var config on error
    return pluginConfig.providers?.resend || null
  }
}