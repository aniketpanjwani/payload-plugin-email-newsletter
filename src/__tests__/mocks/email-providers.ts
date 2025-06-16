import { vi } from 'vitest'

// Mock successful email response
const _mockSuccessResponse = {
  data: {
    id: 'test-email-id',
    from: 'test@example.com',
    to: ['recipient@example.com'],
    created_at: new Date().toISOString(),
  },
  error: null,
}

// Mock error response
const mockErrorResponse = {
  data: null,
  error: {
    type: 'validation_error',
    message: 'Invalid email address',
  },
}

// Behavior-based mock for Resend
export const createResendMock = () => {
  const sentEmails: any[] = []
  const resendMock = {
    emails: {
      send: vi.fn(async (data: any) => {
        // Validate required fields
        if (!data.from || !data.to || !data.subject || !data.html) {
          return mockErrorResponse
        }

        // Simulate rate limiting
        if (sentEmails.filter(e => e.timestamp > Date.now() - 1000).length >= 5) {
          return {
            data: null,
            error: {
              type: 'rate_limit_exceeded',
              message: 'Rate limit exceeded',
            },
          }
        }

        // Simulate invalid email
        if (data.to.some((email: string) => !email.includes('@'))) {
          return mockErrorResponse
        }

        // Store sent email
        const email = {
          ...data,
          id: `test-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        }
        sentEmails.push(email)

        return {
          data: email,
          error: null,
        }
      }),
    },
    // Test helpers
    getSentEmails: () => sentEmails,
    clearSentEmails: () => {
      sentEmails.length = 0
    },
  }

  return resendMock
}

// Behavior-based mock for Broadcast
export const createBroadcastMock = () => {
  const sentEmails: any[] = []
  const subscribers: Map<string, any> = new Map()
  
  const broadcastMock = {
    contacts: {
      create: vi.fn(async (data: any) => {
        if (!data.email) {
          throw new Error('Email is required')
        }

        const contact = {
          id: `contact-${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
          status: 'active',
        }
        subscribers.set(data.email, contact)
        return contact
      }),
      update: vi.fn(async (id: string, data: any) => {
        const existing = Array.from(subscribers.values()).find(s => s.id === id)
        if (!existing) {
          throw new Error('Contact not found')
        }
        const updated = { ...existing, ...data }
        subscribers.set(existing.email, updated)
        return updated
      }),
      delete: vi.fn(async (id: string) => {
        const existing = Array.from(subscribers.values()).find(s => s.id === id)
        if (!existing) {
          throw new Error('Contact not found')
        }
        subscribers.delete(existing.email)
        return { success: true }
      }),
    },
    broadcasts: {
      send: vi.fn(async (data: any) => {
        if (!data.subject || !data.content) {
          throw new Error('Subject and content are required')
        }

        const broadcast = {
          id: `broadcast-${Date.now()}`,
          ...data,
          sent_at: new Date().toISOString(),
          recipients: subscribers.size,
        }
        sentEmails.push(broadcast)
        return broadcast
      }),
    },
    // Test helpers
    getSentEmails: () => sentEmails,
    getSubscribers: () => Array.from(subscribers.values()),
    clearAll: () => {
      sentEmails.length = 0
      subscribers.clear()
    },
  }

  return broadcastMock
}

// Factory function to create email provider mock based on provider type
export const createEmailProviderMock = (provider: 'resend' | 'broadcast') => {
  switch (provider) {
    case 'resend':
      return createResendMock()
    case 'broadcast':
      return createBroadcastMock()
    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}

// Mock resend provider config
export const mockResendProviderConfig = {
  apiKey: 'test-api-key',
  fromEmail: 'test@example.com',
  fromName: 'Test Newsletter',
}