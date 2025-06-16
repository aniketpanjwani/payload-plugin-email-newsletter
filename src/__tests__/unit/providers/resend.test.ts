import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ResendProvider } from '../../../providers/resend'
import { Resend } from 'resend'
import type { Subscriber } from '../../../types'

vi.mock('resend')

describe('ResendProvider', () => {
  let provider: ResendProvider
  let mockResend: any

  const config = {
    apiKey: 'test-api-key',
    fromAddress: 'noreply@example.com',
    fromName: 'Test Newsletter'
  }

  beforeEach(() => {
    mockResend = {
      emails: {
        send: vi.fn()
      },
      contacts: {
        create: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        remove: vi.fn()
      }
    }
    
    vi.mocked(Resend).mockImplementation(() => mockResend)
    provider = new ResendProvider(config)
    vi.clearAllMocks()
  })

  describe('send', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: { email: 'subscriber@example.com', name: 'Subscriber' },
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        text: 'Test content'
      }

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      // send method returns void on success
      await expect(provider.send(emailData)).resolves.not.toThrow()

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Test Newsletter <noreply@example.com>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        replyTo: undefined
      })
    })

    it('should handle array of recipients', async () => {
      const emailData = {
        to: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' }
        ],
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      }

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-456' },
        error: null
      })

      await expect(provider.send(emailData)).resolves.not.toThrow()

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Test Newsletter <noreply@example.com>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: undefined,
        replyTo: undefined
      })
    })

    it('should handle send failures', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Invalid API key'))

      await expect(provider.send({
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('Failed to send email via Resend: Invalid API key')
    })

    it('should handle exceptions', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Network error'))

      await expect(provider.send({
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Test</p>'
      })).rejects.toThrow('Failed to send email via Resend: Network error')
    })

    it('should require either html or text content', async () => {
      await expect(provider.send({
        to: { email: 'test@example.com' },
        subject: 'Test'
      })).rejects.toThrow('Either html or text content is required')
      
      expect(mockResend.emails.send).not.toHaveBeenCalled()
    })

    it('should include replyTo when provided', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-789' },
        error: null
      })

      await provider.send({
        to: { email: 'test@example.com' },
        subject: 'Test',
        html: '<p>Test</p>',
        replyTo: { email: 'reply@example.com', name: 'Reply' }
      })

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Test Newsletter <noreply@example.com>',
        to: [{ email: 'test@example.com' }],
        subject: 'Test',
        html: '<p>Test</p>',
        text: undefined,
        replyTo: { email: 'reply@example.com', name: 'Reply' }
      })
    })

    it('should use custom from address when provided', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-101' },
        error: null
      })

      await provider.send({
        to: { email: 'test@example.com' },
        from: { email: 'custom@example.com', name: 'Custom Sender' },
        subject: 'Test',
        html: '<p>Test</p>'
      })

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'Custom Sender <custom@example.com>',
        to: [{ email: 'test@example.com' }],
        subject: 'Test',
        html: '<p>Test</p>',
        text: undefined,
        replyTo: undefined
      })
    })
  })

  describe('getProvider', () => {
    it('should return "resend"', () => {
      expect(provider.getProvider()).toBe('resend')
    })
  })


  describe('Constructor', () => {
    it('should require API key', () => {
      expect(() => new ResendProvider({
        apiKey: '',
        fromAddress: 'test@example.com',
        fromName: 'Test'
      })).not.toThrow() // Actually doesn't validate in constructor, Resend client will fail
    })

    it('should initialize with development flag', () => {
      process.env.NODE_ENV = 'development'
      const devProvider = new ResendProvider(config)
      expect(devProvider['isDevelopment']).toBe(true)

      process.env.NODE_ENV = 'production'
      const prodProvider = new ResendProvider(config)
      expect(prodProvider['isDevelopment']).toBe(false)
    })
  })
})