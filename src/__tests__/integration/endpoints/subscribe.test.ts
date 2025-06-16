import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSubscribeEndpoint } from '../../../endpoints/subscribe'
import { createPayloadRequestMock, seedCollection, clearCollections } from '../../mocks/payload'
import { mockNewsletterSettings } from '../../fixtures/newsletter-settings'
import { createResendMock } from '../../mocks/email-providers'
import type { NewsletterPluginConfig } from '../../../types'

// Mock email service
vi.mock('../../../services/email', () => ({
  getEmailService: vi.fn(),
}))

import { getEmailService } from '../../../services/email'

describe('Subscribe Endpoint Security', () => {
  let endpoint: any
  let mockReq: any
  let mockRes: any
  let mockEmailService: any
  const config: NewsletterPluginConfig = {
    subscribersSlug: 'subscribers',
    settingsSlug: 'newsletter-settings',
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('newsletter-settings', [mockNewsletterSettings])
    
    endpoint = createSubscribeEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      body: {},
      ip: '127.0.0.1',
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    
    // Setup email service mock
    mockEmailService = createResendMock()
    ;(getEmailService as any).mockResolvedValue(mockEmailService)
    
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should reject requests without email', async () => {
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required',
      })
    })

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '<script>alert("xss")</script>@example.com',
      ]

      for (const email of invalidEmails) {
        mockReq.body = { email }
        await endpoint.handler(mockReq, mockRes)
        
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid email format',
        })
      }
    })

    it('should sanitize email input', async () => {
      mockReq.body = { 
        email: '  User@EXAMPLE.com  ',
        name: '<script>alert("xss")</script>Test User',
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      // Check that create was called with sanitized data
      expect(mockReq.payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@example.com', // Trimmed and lowercased
            name: 'Test User', // XSS stripped
          }),
        })
      )
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce max subscribers per IP', async () => {
      // Create max subscribers from same IP
      const maxSubscribers = mockNewsletterSettings.subscriptionSettings.maxSubscribersPerIP
      
      for (let i = 0; i < maxSubscribers; i++) {
        seedCollection('subscribers', [{
          id: `sub-ip-${i}`,
          email: `user${i}@example.com`,
          ip: '127.0.0.1',
          subscriptionStatus: 'active',
        }])
      }

      mockReq.body = { email: 'newuser@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many subscription attempts from this IP address',
      })
    })

    it('should not count unsubscribed users in rate limit', async () => {
      // Create some unsubscribed users
      for (let i = 0; i < 5; i++) {
        seedCollection('subscribers', [{
          id: `sub-unsub-${i}`,
          email: `unsub${i}@example.com`,
          ip: '127.0.0.1',
          subscriptionStatus: 'unsubscribed',
        }])
      }

      mockReq.body = { email: 'newuser@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Domain Restrictions', () => {
    it('should enforce allowed domains when configured', async () => {
      // Update settings to restrict domains
      const restrictedSettings = {
        ...mockNewsletterSettings,
        subscriptionSettings: {
          ...mockNewsletterSettings.subscriptionSettings,
          allowedDomains: [
            { domain: 'allowed.com' },
            { domain: 'company.com' },
          ],
        },
      }
      clearCollections()
      seedCollection('newsletter-settings', [restrictedSettings])

      // Test blocked domain
      mockReq.body = { email: 'user@blocked.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email domain not allowed',
      })

      // Test allowed domain
      mockReq.body = { email: 'user@allowed.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Duplicate Prevention', () => {
    it('should handle existing active subscribers', async () => {
      seedCollection('subscribers', [{
        id: 'existing-sub',
        email: 'existing@example.com',
        subscriptionStatus: 'active',
      }])

      mockReq.body = { email: 'existing@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'This email is already subscribed',
      })
    })

    it('should allow resubscription of unsubscribed users', async () => {
      seedCollection('subscribers', [{
        id: 'unsub-user',
        email: 'comeback@example.com',
        subscriptionStatus: 'unsubscribed',
      }])

      mockReq.body = { email: 'comeback@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unsub-user',
          data: expect.objectContaining({
            subscriptionStatus: 'pending',
            unsubscribedAt: null,
          }),
        })
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Double Opt-In', () => {
    it('should send confirmation email when double opt-in is enabled', async () => {
      mockReq.body = { email: 'newuser@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockEmailService.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['newuser@example.com'],
          subject: expect.stringContaining('Welcome'),
        })
      )
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Please check your email to confirm your subscription',
        requiresConfirmation: true,
      })
    })

    it('should activate immediately when double opt-in is disabled', async () => {
      // Disable double opt-in
      const noDoubleOptIn = {
        ...mockNewsletterSettings,
        subscriptionSettings: {
          ...mockNewsletterSettings.subscriptionSettings,
          requireDoubleOptIn: false,
        },
      }
      clearCollections()
      seedCollection('newsletter-settings', [noDoubleOptIn])

      mockReq.body = { email: 'instant@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionStatus: 'active',
          }),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle email service failures gracefully', async () => {
      mockEmailService.emails.send.mockRejectedValueOnce(new Error('Email service down'))

      mockReq.body = { email: 'test@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process subscription. Please try again later.',
      })
    })

    it('should not leak internal errors to users', async () => {
      mockReq.payload.create.mockRejectedValueOnce(new Error('Database connection failed'))

      mockReq.body = { email: 'test@example.com' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to process subscription. Please try again later.',
      })
      // Should not expose database error details
    })
  })
})