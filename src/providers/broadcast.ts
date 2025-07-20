import type { EmailProvider, SendEmailParams } from './types'
import { EmailProviderError } from './types'
import type { Subscriber, BroadcastProviderConfig } from '../types'

export class BroadcastProvider implements EmailProvider {
  private apiUrl: string
  private token: string
  private fromAddress: string
  private fromName: string
  private isDevelopment: boolean

  constructor(config: BroadcastProviderConfig & { 
    fromAddress: string
    fromName: string 
  }) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.token = this.isDevelopment 
      ? config.tokens.development || config.tokens.production || ''
      : config.tokens.production || config.tokens.development || ''
    this.fromAddress = config.fromAddress
    this.fromName = config.fromName
  }

  getProvider(): string {
    return 'broadcast'
  }

  async send(params: SendEmailParams): Promise<void> {
    try {
      const from = params.from || {
        email: this.fromAddress,
        name: this.fromName,
      }

      const recipients = Array.isArray(params.to) ? params.to : [params.to]
      
      // Broadcast expects a specific format
      const response = await fetch(`${this.apiUrl}/api/v1/transactionals.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipients[0], // Broadcast API expects a single recipient for transactional emails
          subject: params.subject,
          body: params.html || params.text || '',
          reply_to: params.replyTo || from.email,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to send email via Broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'broadcast',
        error
      )
    }
  }

  async addContact(contact: Subscriber): Promise<void> {
    try {
      const [firstName, ...lastNameParts] = (contact.name || '').split(' ')
      const lastName = lastNameParts.join(' ')

      const response = await fetch(`${this.apiUrl}/api/v1/subscribers.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber: {
            email: contact.email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            tags: [`lang:${contact.locale || 'en'}`],
            is_active: contact.subscriptionStatus === 'active',
            source: contact.source,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to add contact to Broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'broadcast',
        error
      )
    }
  }

  async updateContact(contact: Subscriber): Promise<void> {
    try {
      // First, try to find the contact
      const searchResponse = await fetch(
        `${this.apiUrl}/api/v1/subscribers/find.json?email=${encodeURIComponent(contact.email)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      )

      if (!searchResponse.ok) {
        // If contact doesn't exist, create it
        await this.addContact(contact)
        return
      }

      const existingContact = await searchResponse.json()

      if (!existingContact || !existingContact.id) {
        await this.addContact(contact)
        return
      }

      const [firstName, ...lastNameParts] = (contact.name || '').split(' ')
      const lastName = lastNameParts.join(' ')

      // Update existing contact
      const response = await fetch(`${this.apiUrl}/api/v1/subscribers.json`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contact.email,
          subscriber: {
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            tags: [`lang:${contact.locale || 'en'}`],
            is_active: contact.subscriptionStatus === 'active',
            source: contact.source,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to update contact in Broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'broadcast',
        error
      )
    }
  }

  async removeContact(email: string): Promise<void> {
    try {
      // First, find the contact
      const searchResponse = await fetch(
        `${this.apiUrl}/api/v1/subscribers/find.json?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      )

      if (!searchResponse.ok) {
        // Contact doesn't exist, nothing to remove
        return
      }

      const contact = await searchResponse.json()

      if (!contact || !contact.id) {
        return
      }

      // Deactivate the contact
      const response = await fetch(`${this.apiUrl}/api/v1/subscribers/deactivate.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Broadcast API error: ${response.status} - ${error}`)
      }
    } catch (error: unknown) {
      throw new EmailProviderError(
        `Failed to remove contact from Broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'broadcast',
        error
      )
    }
  }
}