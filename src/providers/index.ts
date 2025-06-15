import type { EmailProvider, EmailServiceConfig, SendEmailParams } from './types'
import type { Subscriber } from '../types'
import { ResendProvider } from './resend'
import { BroadcastProvider } from './broadcast'

export * from './types'

export class EmailService {
  private provider: EmailProvider

  constructor(config: EmailServiceConfig) {
    this.provider = this.createProvider(config)
  }

  private createProvider(config: EmailServiceConfig): EmailProvider {
    const baseConfig = {
      fromAddress: config.fromAddress,
      fromName: config.fromName,
    }

    switch (config.provider) {
      case 'resend':
        if (!config.resend) {
          throw new Error('Resend configuration is required when using Resend provider')
        }
        return new ResendProvider({
          ...config.resend,
          ...baseConfig,
        })

      case 'broadcast':
        if (!config.broadcast) {
          throw new Error('Broadcast configuration is required when using Broadcast provider')
        }
        return new BroadcastProvider({
          ...config.broadcast,
          ...baseConfig,
        })

      default:
        throw new Error(`Unknown email provider: ${config.provider}`)
    }
  }

  async send(params: SendEmailParams): Promise<void> {
    return this.provider.send(params)
  }

  async addContact(contact: Subscriber): Promise<void> {
    return this.provider.addContact(contact)
  }

  async updateContact(contact: Subscriber): Promise<void> {
    return this.provider.updateContact(contact)
  }

  async removeContact(email: string): Promise<void> {
    return this.provider.removeContact(email)
  }

  getProvider(): string {
    return this.provider.getProvider()
  }

  /**
   * Update the provider configuration
   * Useful when settings are changed in the admin UI
   */
  updateConfig(config: EmailServiceConfig): void {
    this.provider = this.createProvider(config)
  }
}

/**
 * Create email service from plugin configuration
 */
export function createEmailService(config: EmailServiceConfig): EmailService {
  return new EmailService(config)
}