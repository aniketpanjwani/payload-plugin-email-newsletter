import { Resend } from 'resend'
import type { EmailProvider, SendEmailParams } from './types'
import { EmailProviderError } from './types'
import type { Subscriber, ResendProviderConfig } from '../types'

export class ResendProvider implements EmailProvider {
  private client: Resend
  private audienceIds: ResendProviderConfig['audienceIds']
  private fromAddress: string
  private fromName: string
  private isDevelopment: boolean

  constructor(config: ResendProviderConfig & { 
    fromAddress: string
    fromName: string 
  }) {
    this.client = new Resend(config.apiKey)
    this.audienceIds = config.audienceIds || {}
    this.fromAddress = config.fromAddress
    this.fromName = config.fromName
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  getProvider(): string {
    return 'resend'
  }

  async send(params: SendEmailParams): Promise<void> {
    try {
      const from = params.from || {
        email: this.fromAddress,
        name: this.fromName,
      }

      if (!params.html && !params.text) {
        throw new Error('Either html or text content is required')
      }

      await this.client.emails.send({
        from: `${from.name} <${from.email}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html || '',
        text: params.text,
        replyTo: params.replyTo,
      })
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to send email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'resend',
        error
      )
    }
  }

  async addContact(contact: Subscriber): Promise<void> {
    try {
      const audienceId = this.getAudienceId(contact.locale)
      if (!audienceId) {
        console.warn(`No audience ID configured for locale: ${contact.locale}`)
        return
      }

      await this.client.contacts.create({
        email: contact.email,
        firstName: contact.name?.split(' ')[0],
        lastName: contact.name?.split(' ').slice(1).join(' '),
        unsubscribed: contact.subscriptionStatus === 'unsubscribed',
        audienceId,
      })
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to add contact to Resend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'resend',
        error
      )
    }
  }

  async updateContact(contact: Subscriber): Promise<void> {
    try {
      const audienceId = this.getAudienceId(contact.locale)
      if (!audienceId) {
        console.warn(`No audience ID configured for locale: ${contact.locale}`)
        return
      }

      // Resend requires finding the contact first
      const contacts = await this.client.contacts.list({ audienceId })
      const existingContact = contacts.data?.data?.find(c => c.email === contact.email)

      if (existingContact) {
        await this.client.contacts.update({
          id: existingContact.id,
          audienceId,
          firstName: contact.name?.split(' ')[0],
          lastName: contact.name?.split(' ').slice(1).join(' '),
          unsubscribed: contact.subscriptionStatus === 'unsubscribed',
        })
      } else {
        // If contact doesn't exist, add them
        await this.addContact(contact)
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to update contact in Resend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'resend',
        error
      )
    }
  }

  async removeContact(email: string): Promise<void> {
    try {
      // Resend doesn't have a direct remove method, so we unsubscribe instead
      // First, we need to find the contact across all audiences
      for (const locale in this.audienceIds) {
        const audienceId = this.getAudienceId(locale)
        if (!audienceId) continue

        const contacts = await this.client.contacts.list({ audienceId })
        const contact = contacts.data?.data?.find(c => c.email === email)

        if (contact) {
          await this.client.contacts.update({
            id: contact.id,
            audienceId,
            unsubscribed: true,
          })
          break
        }
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to remove contact from Resend: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'resend',
        error
      )
    }
  }

  private getAudienceId(locale?: string): string | undefined {
    const localeKey = locale || 'en'
    if (!this.audienceIds) return undefined
    
    const localeConfig = this.audienceIds[localeKey]
    if (!localeConfig) return undefined

    const audienceId = this.isDevelopment 
      ? (localeConfig.development || localeConfig.production)
      : (localeConfig.production || localeConfig.development)
    
    return audienceId
  }
}