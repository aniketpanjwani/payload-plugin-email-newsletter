import type { NewsletterPluginConfig } from '../../types'

/**
 * Minimal test configuration for NewsletterPluginConfig
 * Provides the required providers field with test values
 */
export const createTestConfig = (overrides?: Partial<NewsletterPluginConfig>): NewsletterPluginConfig => {
  return {
    providers: {
      default: 'resend',
      resend: {
        apiKey: 'test-api-key',
      },
    },
    ...overrides,
  }
}