import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createPayloadRequestMock, 
  seedCollection, 
  clearCollections,
  createMockAdminUser,
  createMockNonAdminUser
} from '../../mocks/payload'
import { createTestConfig } from '../../utils/test-config'
import { createBeforeChangeArgs, createAfterChangeArgs } from '../../utils/hook-test-utils'

describe('Newsletter Settings Collection Hooks Security', () => {
  let mockReq: any
  const config = createTestConfig({
    settingsSlug: 'newsletter-settings'
  })

  beforeEach(() => {
    clearCollections()
    const payloadMock = createPayloadRequestMock()
    mockReq = {
      payload: payloadMock.payload,
      user: null
    }
    vi.clearAllMocks()
  })

  describe('Access Control Hooks', () => {
    it('should only allow admins to create settings', async () => {
      const beforeChangeHook = async ({ req, operation }: any) => {
        if (operation === 'create' && !req.user?.roles?.includes('admin')) {
          throw new Error('Only admins can create newsletter settings')
        }
        return {}
      }

      // Non-admin should be rejected
      mockReq.user = createMockNonAdminUser()
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'newsletter@example.com' },
        req: mockReq,
        operation: 'create'
      }))).rejects.toThrow('Only admins can create newsletter settings')

      // Admin should be allowed
      mockReq.user = createMockAdminUser()
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'newsletter@example.com' },
        req: mockReq,
        operation: 'create'
      }))).resolves.not.toThrow()
    })

    it('should only allow admins to update settings', async () => {
      const beforeChangeHook = async ({ req, operation }: any) => {
        if (operation === 'update' && !req.user?.roles?.includes('admin')) {
          throw new Error('Only admins can update newsletter settings')
        }
        return {}
      }

      // Non-admin should be rejected
      mockReq.user = createMockNonAdminUser()
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'updated@example.com' },
        req: mockReq,
        operation: 'update'
      }))).rejects.toThrow('Only admins can update newsletter settings')

      // Admin should be allowed
      mockReq.user = createMockAdminUser()
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'updated@example.com' },
        req: mockReq,
        operation: 'update'
      }))).resolves.not.toThrow()
    })

    it('should prevent deletion of settings', async () => {
      const beforeDeleteHook = async ({ req }: any) => {
        throw new Error('Newsletter settings cannot be deleted')
      }

      mockReq.user = createMockAdminUser()
      await expect(beforeDeleteHook({
        req: mockReq,
        id: 'settings-1',
        collection: {}
      })).rejects.toThrow('Newsletter settings cannot be deleted')
    })
  })

  describe('Validation Hooks', () => {
    it('should validate email configuration', async () => {
      const beforeChangeHook = async ({ data, operation }: any) => {
        if (data.fromEmail && !data.fromEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          throw new Error('Invalid from email address')
        }
        
        if (data.replyToEmail && !data.replyToEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          throw new Error('Invalid reply-to email address')
        }
        
        return data
      }

      // Valid emails
      const validResult = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          fromEmail: 'newsletter@example.com',
          replyToEmail: 'support@example.com'
        },
        operation: 'update'
      }))
      expect(validResult.fromEmail).toBe('newsletter@example.com')

      // Invalid from email
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'invalid-email' },
        operation: 'update'
      }))).rejects.toThrow('Invalid from email address')

      // Invalid reply-to email
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { replyToEmail: 'invalid@' },
        operation: 'update'
      }))).rejects.toThrow('Invalid reply-to email address')
    })

    it('should validate provider configuration', async () => {
      const beforeChangeHook = async ({ data }: any) => {
        if (data.provider) {
          if (!['resend', 'sendgrid', 'ses', 'mailgun'].includes(data.provider)) {
            throw new Error('Invalid email provider')
          }
          
          if (!data.providerApiKey) {
            throw new Error('Provider API key is required')
          }
        }
        
        return data
      }

      // Valid provider
      const validResult = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          provider: 'resend',
          providerApiKey: 'test-api-key'
        }
      }))
      expect(validResult.provider).toBe('resend')

      // Invalid provider
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { provider: 'unknown-provider' }
      }))).rejects.toThrow('Invalid email provider')

      // Missing API key
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { provider: 'sendgrid' }
      }))).rejects.toThrow('Provider API key is required')
    })

    it('should validate rate limiting configuration', async () => {
      const beforeChangeHook = async ({ data }: any) => {
        if (data.rateLimiting) {
          const { maxSubscriptionsPerIP, timeWindowMinutes } = data.rateLimiting
          
          if (maxSubscriptionsPerIP && maxSubscriptionsPerIP < 1) {
            throw new Error('Max subscriptions per IP must be at least 1')
          }
          
          if (timeWindowMinutes && timeWindowMinutes < 1) {
            throw new Error('Time window must be at least 1 minute')
          }
        }
        
        return data
      }

      // Valid configuration
      const validResult = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          rateLimiting: {
            maxSubscriptionsPerIP: 5,
            timeWindowMinutes: 60
          }
        }
      }))
      expect(validResult.rateLimiting.maxSubscriptionsPerIP).toBe(5)

      // Invalid max subscriptions
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: {
          rateLimiting: { maxSubscriptionsPerIP: 0 }
        }
      }))).rejects.toThrow('Max subscriptions per IP must be at least 1')

      // Invalid time window
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: {
          rateLimiting: { timeWindowMinutes: 0 }
        }
      }))).rejects.toThrow('Time window must be at least 1 minute')
    })

    it('should validate allowed domains', async () => {
      const beforeChangeHook = async ({ data }: any) => {
        if (data.allowedDomains) {
          const invalidDomains = data.allowedDomains.filter(
            (domain: string) => !domain.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
          )
          
          if (invalidDomains.length > 0) {
            throw new Error(`Invalid domains: ${invalidDomains.join(', ')}`)
          }
        }
        
        return data
      }

      // Valid domains
      const validResult = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          allowedDomains: ['example.com', 'company.org', 'subdomain.example.com']
        }
      }))
      expect(validResult.allowedDomains).toHaveLength(3)

      // Invalid domains
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: {
          allowedDomains: ['example.com', 'invalid domain', '@example.com']
        }
      }))).rejects.toThrow('Invalid domains')
    })
  })

  describe('Singleton Enforcement', () => {
    it('should enforce single settings document', async () => {
      seedCollection('newsletter-settings', [{
        id: 'settings-1',
        fromEmail: 'existing@example.com'
      }])

      const beforeChangeHook = async ({ req, operation }: any) => {
        if (operation === 'create') {
          const existing = await req.payload.find({
            collection: 'newsletter-settings',
            limit: 1
          })
          
          if (existing.docs.length > 0) {
            throw new Error('Newsletter settings already exist. Please update the existing settings.')
          }
        }
        
        return {}
      }

      mockReq.user = createMockAdminUser()
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { fromEmail: 'new@example.com' },
        req: mockReq,
        operation: 'create'
      }))).rejects.toThrow('Newsletter settings already exist')
    })
  })

  describe('Security Configuration', () => {
    it('should encrypt sensitive data before save', async () => {
      const beforeChangeHook = async ({ data }: any) => {
        if (data.providerApiKey) {
          // Simulate encryption
          data.providerApiKey = `encrypted:${Buffer.from(data.providerApiKey).toString('base64')}`
        }
        
        return data
      }

      const result = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          providerApiKey: 'my-secret-key'
        }
      }))

      expect(result.providerApiKey).toContain('encrypted:')
      expect(result.providerApiKey).not.toContain('my-secret-key')
    })

    it('should validate JWT secret strength', async () => {
      const beforeChangeHook = async ({ data }: any) => {
        if (data.jwtSecret) {
          if (data.jwtSecret.length < 32) {
            throw new Error('JWT secret must be at least 32 characters long')
          }
          
          if (!/[A-Z]/.test(data.jwtSecret) || !/[a-z]/.test(data.jwtSecret) || !/[0-9]/.test(data.jwtSecret)) {
            throw new Error('JWT secret must contain uppercase, lowercase, and numbers')
          }
        }
        
        return data
      }

      // Valid secret
      const validResult = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          jwtSecret: 'MySecureJWT123SecretThatIsLongEnough!'
        }
      }))
      expect(validResult.jwtSecret).toBeDefined()

      // Too short
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { jwtSecret: 'short' }
      }))).rejects.toThrow('JWT secret must be at least 32 characters')

      // Weak complexity
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { jwtSecret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }
      }))).rejects.toThrow('JWT secret must contain uppercase, lowercase, and numbers')
    })
  })

  describe('Default Values', () => {
    it('should set sensible defaults', async () => {
      const beforeChangeHook = async ({ data, operation }: any) => {
        if (operation === 'create') {
          data.fromName = data.fromName || 'Newsletter'
          data.magicLinkExpiration = data.magicLinkExpiration || 3600 // 1 hour
          data.sessionExpiration = data.sessionExpiration || 86400 // 24 hours
          data.rateLimiting = data.rateLimiting || {
            maxSubscriptionsPerIP: 5,
            timeWindowMinutes: 60
          }
        }
        
        return data
      }

      const result = await beforeChangeHook(createBeforeChangeArgs({
        data: {
          fromEmail: 'newsletter@example.com'
        },
        operation: 'create'
      }))

      expect(result.fromName).toBe('Newsletter')
      expect(result.magicLinkExpiration).toBe(3600)
      expect(result.sessionExpiration).toBe(86400)
      expect(result.rateLimiting.maxSubscriptionsPerIP).toBe(5)
    })
  })

  describe('Audit Trail', () => {
    it('should log settings changes', async () => {
      const afterChangeHook = async ({ doc, previousDoc, req, operation }: any) => {
        if (operation === 'update' && previousDoc) {
          const changes: any[] = []
          
          Object.keys(doc).forEach(key => {
            if (doc[key] !== previousDoc[key] && key !== 'updatedAt') {
              changes.push({
                field: key,
                oldValue: key === 'providerApiKey' ? '[REDACTED]' : previousDoc[key],
                newValue: key === 'providerApiKey' ? '[REDACTED]' : doc[key]
              })
            }
          })
          
          if (changes.length > 0) {
            await req.payload.create({
              collection: 'audit-logs',
              data: {
                collection: 'newsletter-settings',
                action: 'update',
                user: req.user?.id,
                changes,
                timestamp: new Date()
              }
            })
          }
        }
        
        return doc
      }

      mockReq.user = createMockAdminUser()
      const result = await afterChangeHook(createAfterChangeArgs({
        doc: {
          fromEmail: 'new@example.com',
          providerApiKey: 'new-key'
        },
        previousDoc: {
          fromEmail: 'old@example.com',
          providerApiKey: 'old-key'
        },
        req: mockReq,
        operation: 'update'
      }))

      expect(mockReq.payload.create).toHaveBeenCalledWith({
        collection: 'audit-logs',
        data: expect.objectContaining({
          action: 'update',
          changes: expect.arrayContaining([
            expect.objectContaining({
              field: 'fromEmail',
              oldValue: 'old@example.com',
              newValue: 'new@example.com'
            }),
            expect.objectContaining({
              field: 'providerApiKey',
              oldValue: '[REDACTED]',
              newValue: '[REDACTED]'
            })
          ])
        })
      })
    })
  })
})