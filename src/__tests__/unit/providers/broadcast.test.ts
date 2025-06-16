import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BroadcastProvider } from '../../../providers/broadcast'
import type { SendEmailParams } from '../../../providers/types'

// Mock global fetch
global.fetch = vi.fn()

describe('BroadcastProvider', () => {
  let provider: BroadcastProvider
  const mockFetch = vi.mocked(global.fetch)

  const config = {
    apiUrl: 'https://api.broadcast.example.com',
    tokens: {
      development: 'dev-token-123',
      production: 'prod-token-456'
    },
    fromAddress: 'noreply@example.com',
    fromName: 'Test Newsletter'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default to development environment
    process.env.NODE_ENV = 'development'
    provider = new BroadcastProvider(config)
  })

  describe('constructor', () => {
    it('should use development token in development environment', () => {
      process.env.NODE_ENV = 'development'
      provider = new BroadcastProvider(config)
      expect(provider['token']).toBe('dev-token-123')
    })

    it('should use production token in production environment', () => {
      process.env.NODE_ENV = 'production'
      provider = new BroadcastProvider(config)
      expect(provider['token']).toBe('prod-token-456')
    })

    it('should remove trailing slash from API URL', () => {
      const configWithSlash = {
        ...config,
        apiUrl: 'https://api.broadcast.example.com/'
      }
      provider = new BroadcastProvider(configWithSlash)
      expect(provider['apiUrl']).toBe('https://api.broadcast.example.com')
    })
  })

  describe('getProvider', () => {
    it('should return "broadcast"', () => {
      expect(provider.getProvider()).toBe('broadcast')
    })
  })

  describe('send', () => {
    const emailParams: SendEmailParams = {
      to: {
        email: 'user@example.com',
        name: 'Test User'
      },
      subject: 'Test Newsletter',
      html: '<h1>Hello</h1><p>Test content</p>',
      text: 'Hello\nTest content'
    }

    it('should send email successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'broadcast-123', status: 'sent' })
      } as Response)

      await provider.send(emailParams)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.broadcast.example.com/api/v1/emails',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer dev-token-123',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from_email: 'noreply@example.com',
            from_name: 'Test Newsletter',
            to: [emailParams.to],
            subject: emailParams.subject,
            html_body: emailParams.html,
            text_body: emailParams.text
          })
        }
      )
    })

    it('should handle multiple recipients', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'broadcast-456', status: 'sent' })
      } as Response)

      const multipleRecipients: SendEmailParams = {
        ...emailParams,
        to: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' }
        ]
      }

      await provider.send(multipleRecipients)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.to).toHaveLength(2)
      expect(requestBody.to[0].email).toBe('user1@example.com')
      expect(requestBody.to[1].email).toBe('user2@example.com')
    })

    it('should use custom from address when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'broadcast-789', status: 'sent' })
      } as Response)

      const customFromParams: SendEmailParams = {
        ...emailParams,
        from: {
          email: 'custom@example.com',
          name: 'Custom Sender'
        }
      }

      await provider.send(customFromParams)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.from_email).toBe('custom@example.com')
      expect(requestBody.from_name).toBe('Custom Sender')
    })

    it('should handle non-200 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API token'
      } as Response)

      await expect(provider.send(emailParams)).rejects.toThrow(
        'Failed to send email via Broadcast: Broadcast API error: 401 - Invalid API token'
      )
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(provider.send(emailParams)).rejects.toThrow('Failed to send email via Broadcast: Network error')
    })

    it('should include reply-to header when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'broadcast-101', status: 'sent' })
      } as Response)

      const replyToParams: SendEmailParams = {
        ...emailParams,
        replyTo: {
          email: 'reply@example.com',
          name: 'Reply Here'
        }
      }

      await provider.send(replyToParams)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.reply_to).toEqual({
        email: 'reply@example.com',
        name: 'Reply Here'
      })
    })

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('No content') }
      } as Response)

      // Should not throw - empty response is okay for successful send
      await expect(provider.send(emailParams)).resolves.not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded'
      } as Response)

      await expect(provider.send({
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('Failed to send email via Broadcast: Broadcast API error: 429 - Rate limit exceeded')
    })

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({
          error: 'Invalid email format',
          field: 'to[0].email'
        })
      } as Response)

      await expect(provider.send({
        to: { email: 'invalid-email' },
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('Failed to send email via Broadcast: Broadcast API error: 400 - {"error":"Invalid email format","field":"to[0].email"}')
    })
  })
})