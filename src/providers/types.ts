import type { Subscriber } from '../types'

export interface EmailProvider {
  send(params: SendEmailParams): Promise<void>
  addContact(contact: Subscriber): Promise<void>
  updateContact(contact: Subscriber): Promise<void>
  removeContact(email: string): Promise<void>
  getProvider(): string
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
  from?: {
    email: string
    name?: string
  }
  replyTo?: string
}

export interface EmailServiceConfig {
  provider: 'resend' | 'broadcast' | string
  fromAddress: string
  fromName: string
  replyTo?: string
  resend?: {
    apiKey: string
    audienceIds?: Record<string, { production?: string; development?: string }>
  }
  broadcast?: {
    apiUrl: string
    tokens: {
      production?: string
      development?: string
    }
  }
}

export class EmailProviderError extends Error {
  provider: string
  originalError?: any

  constructor(message: string, provider: string, originalError?: any) {
    super(message)
    this.name = 'EmailProviderError'
    this.provider = provider
    this.originalError = originalError
  }
}