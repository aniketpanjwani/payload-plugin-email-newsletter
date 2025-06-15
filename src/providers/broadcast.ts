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
      const response = await fetch(`${this.apiUrl}/api/v1/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_email: from.email,
          from_name: from.name,
          to: recipients,
          subject: params.subject,
          html_body: params.html,
          text_body: params.text,
          reply_to: params.replyTo,
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
      const response = await fetch(`${this.apiUrl}/api/v1/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contact.email,
          name: contact.name,
          status: contact.subscriptionStatus === 'active' ? 'subscribed' : 'unsubscribed',
          metadata: {
            locale: contact.locale,
            source: contact.source,
            ...contact.utmParameters,
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
        `${this.apiUrl}/api/v1/contacts?email=${encodeURIComponent(contact.email)}`,
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

      const contacts = await searchResponse.json()
      const existingContact = contacts.data?.[0]

      if (!existingContact) {
        await this.addContact(contact)
        return
      }

      // Update existing contact
      const response = await fetch(`${this.apiUrl}/api/v1/contacts/${existingContact.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contact.email,
          name: contact.name,
          status: contact.subscriptionStatus === 'active' ? 'subscribed' : 'unsubscribed',
          metadata: {
            locale: contact.locale,
            source: contact.source,
            ...contact.utmParameters,
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
        `${this.apiUrl}/api/v1/contacts?email=${encodeURIComponent(email)}`,
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

      const contacts = await searchResponse.json()
      const contact = contacts.data?.[0]

      if (!contact) {
        return
      }

      // Delete the contact
      const response = await fetch(`${this.apiUrl}/api/v1/contacts/${contact.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
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