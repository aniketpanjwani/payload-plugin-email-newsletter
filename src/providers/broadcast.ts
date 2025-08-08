import type { EmailProvider, SendEmailParams } from './types'
import { EmailProviderError } from './types'
import type { Subscriber, BroadcastProviderConfig } from '../types'

export class BroadcastProvider implements EmailProvider {
  private apiUrl: string
  private token: string
  private fromAddress: string
  private fromName: string
  private replyTo?: string

  constructor(config: BroadcastProviderConfig & { 
    fromAddress: string
    fromName: string 
  }) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '') // Remove trailing slash
    this.token = config.token
    this.fromAddress = config.fromAddress
    this.fromName = config.fromName
    this.replyTo = config.replyTo
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
          from: `${from.name} <${from.email}>`, // Include from name and email
          subject: params.subject,
          body: params.html || params.text || '',
          reply_to: params.replyTo || this.replyTo || from.email,
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
            source: contact.source,
          },
        }),
      })

      if (!response.ok && response.status !== 201) {
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
      const [firstName, ...lastNameParts] = (contact.name || '').split(' ')
      const lastName = lastNameParts.join(' ')

      // Handle unsubscribe
      if (contact.subscriptionStatus === 'unsubscribed') {
        const response = await fetch(`${this.apiUrl}/api/v1/subscribers/unsubscribe.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: contact.email }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Broadcast API error: ${response.status} - ${error}`)
        }
        return
      }

      // Handle subscribe/resubscribe or update
      // Use the create endpoint which handles both new and existing subscribers
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
            source: contact.source,
          },
        }),
      })

      if (!response.ok && response.status !== 201) {
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
      // Use unsubscribe endpoint to properly mark contact as unsubscribed
      const response = await fetch(`${this.apiUrl}/api/v1/subscribers/unsubscribe.json`, {
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