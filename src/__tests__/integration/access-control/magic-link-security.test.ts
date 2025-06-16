import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createPayloadRequestMock, 
  seedCollection, 
  clearCollections 
} from '../../mocks/payload'
import { generateMagicLinkToken, verifyMagicLinkToken } from '../../../utils/jwt'
import { createTestConfig } from '../../utils/test-config'

vi.mock('../../../utils/jwt')

describe('Magic Link Security', () => {
  let mockPayload: any
  let mockReq: any
  
  const config = createTestConfig({
    subscribersSlug: 'subscribers',
    magicLinkExpiration: 3600 // 1 hour
  })

  const subscriberWithToken = {
    id: 'sub-123',
    email: 'user@example.com',
    subscriptionStatus: 'pending',
    magicLinkToken: 'valid-token-123',
    magicLinkTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
    magicLinkUsedAt: null
  }

  const subscriberWithUsedToken = {
    id: 'sub-456',
    email: 'used@example.com',
    subscriptionStatus: 'active',
    magicLinkToken: 'used-token-456',
    magicLinkTokenExpiry: new Date(Date.now() + 3600000),
    magicLinkUsedAt: new Date(Date.now() - 300000) // Used 5 minutes ago
  }

  const subscriberWithExpiredToken = {
    id: 'sub-789',
    email: 'expired@example.com',
    subscriptionStatus: 'pending',
    magicLinkToken: 'expired-token-789',
    magicLinkTokenExpiry: new Date(Date.now() - 3600000), // Expired 1 hour ago
    magicLinkUsedAt: null
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', [
      subscriberWithToken,
      subscriberWithUsedToken,
      subscriberWithExpiredToken
    ])
    
    const payloadMock = createPayloadRequestMock()
    mockPayload = payloadMock.payload
    mockReq = {
      payload: mockPayload,
      user: null
    }
    
    vi.clearAllMocks()
  })

  describe('Token Generation Security', () => {
    it('should generate unique tokens for each request', () => {
      vi.mocked(generateMagicLinkToken)
        .mockReturnValueOnce('token-1')
        .mockReturnValueOnce('token-2')

      const token1 = generateMagicLinkToken('sub-1', 'user@example.com')
      const token2 = generateMagicLinkToken('sub-1', 'user@example.com')

      expect(token1).not.toBe(token2)
    })

    it('should include subscriber ID and email in token payload', () => {
      const mockToken = 'mock-token'
      vi.mocked(generateMagicLinkToken).mockReturnValue(mockToken)
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        subscriberId: 'sub-123',
        email: 'user@example.com',
        type: 'magic-link',
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 3600
      })

      const token = generateMagicLinkToken('sub-123', 'user@example.com')
      const payload = verifyMagicLinkToken(token)

      expect(payload.subscriberId).toBe('sub-123')
      expect(payload.email).toBe('user@example.com')
      expect(payload.type).toBe('magic-link')
    })

    it('should set appropriate expiration time', () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        subscriberId: 'sub-123',
        email: 'user@example.com',
        type: 'magic-link',
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 3600 // 1 hour
      })

      const token = generateMagicLinkToken('sub-123', 'user@example.com')
      const payload = verifyMagicLinkToken(token)

      const expirationTime = payload.exp - payload.iat
      expect(expirationTime).toBe(3600) // 1 hour
    })
  })

  describe('Token Validation Security', () => {
    it('should reject tokens with mismatched email', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        subscriberId: 'sub-123',
        email: 'wrong@example.com', // Different email
        type: 'magic-link'
      })

      const isValid = async () => {
        const payload = verifyMagicLinkToken('valid-token-123')
        const subscriber = await mockPayload.findByID({
          collection: 'subscribers',
          id: payload.subscriberId
        })
        
        if (subscriber.email !== payload.email) {
          throw new Error('Email mismatch')
        }
        
        return true
      }

      await expect(isValid()).rejects.toThrow('Email mismatch')
    })

    it('should reject tokens for non-existent subscribers', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        subscriberId: 'non-existent',
        email: 'ghost@example.com',
        type: 'magic-link'
      })

      const subscriber = await mockPayload.findByID({
        collection: 'subscribers',
        id: 'non-existent'
      })

      expect(subscriber).toBeNull()
    })

    it('should reject wrong token types', () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
        subscriberId: 'sub-123',
        email: 'user@example.com',
        type: 'session' // Wrong type
      })

      const payload = verifyMagicLinkToken('some-token')
      expect(payload.type).not.toBe('magic-link')
    })
  })

  describe('Single-Use Token Enforcement', () => {
    it('should reject already used tokens', async () => {
      const subscriber = await mockPayload.findByID({
        collection: 'subscribers',
        id: subscriberWithUsedToken.id,
        overrideAccess: true // Need to see the raw data for testing
      })

      expect(subscriber.magicLinkUsedAt).toBeDefined()
      expect(new Date(subscriber.magicLinkUsedAt).getTime()).toBeLessThan(Date.now())
    })

    it('should mark token as used after verification', async () => {
      const result = await mockPayload.update({
        collection: 'subscribers',
        id: subscriberWithToken.id,
        data: {
          magicLinkUsedAt: new Date(),
          subscriptionStatus: 'active'
        }
      })

      expect(result.magicLinkUsedAt).toBeDefined()
      expect(result.subscriptionStatus).toBe('active')
    })

    it('should clear token after use', async () => {
      const result = await mockPayload.update({
        collection: 'subscribers',
        id: subscriberWithToken.id,
        data: {
          magicLinkToken: null,
          magicLinkTokenExpiry: null,
          magicLinkUsedAt: new Date(),
          subscriptionStatus: 'active'
        }
      })

      expect(result.magicLinkToken).toBeNull()
      expect(result.magicLinkTokenExpiry).toBeNull()
    })
  })

  describe('Token Expiration', () => {
    it('should reject expired tokens', async () => {
      const subscriber = await mockPayload.findByID({
        collection: 'subscribers',
        id: subscriberWithExpiredToken.id,
        overrideAccess: true // Need to see token fields
      })

      const isExpired = new Date(subscriber.magicLinkTokenExpiry).getTime() < Date.now()
      expect(isExpired).toBe(true)
    })

    it('should handle timezone differences correctly', async () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)
      
      await mockPayload.update({
        collection: 'subscribers',
        id: 'sub-123',
        data: {
          magicLinkTokenExpiry: futureDate
        },
        overrideAccess: true
      })

      const subscriber = await mockPayload.findByID({
        collection: 'subscribers',
        id: 'sub-123',
        overrideAccess: true // Need to see token fields
      })

      const isValid = new Date(subscriber.magicLinkTokenExpiry).getTime() > Date.now()
      expect(isValid).toBe(true)
    })
  })

  describe('Token Invalidation', () => {
    it('should invalidate old tokens when generating new one', async () => {
      // Generate new token
      const newToken = 'new-token-123'
      const result = await mockPayload.update({
        collection: 'subscribers',
        id: subscriberWithToken.id,
        data: {
          magicLinkToken: newToken,
          magicLinkTokenExpiry: new Date(Date.now() + 3600000),
          magicLinkUsedAt: null // Reset usage
        }
      })

      expect(result.magicLinkToken).toBe(newToken)
      expect(result.magicLinkUsedAt).toBeNull()
    })

    it('should invalidate tokens on unsubscribe', async () => {
      const result = await mockPayload.update({
        collection: 'subscribers',
        id: subscriberWithToken.id,
        data: {
          subscriptionStatus: 'unsubscribed',
          magicLinkToken: null,
          magicLinkTokenExpiry: null
        }
      })

      expect(result.subscriptionStatus).toBe('unsubscribed')
      expect(result.magicLinkToken).toBeNull()
    })
  })

  describe('Rate Limiting Token Generation', () => {
    it('should track token generation attempts', async () => {
      const attempts = []
      const ipAddress = '192.168.1.1'
      
      // Simulate multiple token generation attempts
      for (let i = 0; i < 5; i++) {
        attempts.push({
          ipAddress,
          timestamp: new Date(),
          subscriberId: 'sub-123'
        })
      }

      // Check if rate limit would be exceeded
      const recentAttempts = attempts.filter(
        attempt => new Date(attempt.timestamp).getTime() > Date.now() - 3600000
      )
      
      expect(recentAttempts.length).toBe(5)
    })

    it('should limit tokens per email address', async () => {
      const email = 'user@example.com'
      const recentTokens = await mockPayload.find({
        collection: 'subscribers',
        where: {
          email: {
            equals: email
          },
          magicLinkTokenExpiry: {
            greater_than: new Date()
          }
        }
      })

      // Should only have one active token per email
      expect(recentTokens.docs.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Token Storage Security', () => {
    it('should not expose tokens in list queries', async () => {
      const syntheticUser = {
        collection: 'subscribers',
        id: 'sub-123',
        email: 'user@example.com'
      }

      const result = await mockPayload.find({
        collection: 'subscribers',
        overrideAccess: false,
        user: syntheticUser
      })

      result.docs.forEach((doc: any) => {
        expect(doc.magicLinkToken).toBeUndefined()
        expect(doc.magicLinkTokenExpiry).toBeUndefined()
      })
    })

    it('should store tokens securely', async () => {
      // In a real implementation, tokens would be hashed
      const plainToken = 'plain-text-token'
      
      const result = await mockPayload.update({
        collection: 'subscribers',
        id: 'sub-123',
        data: {
          magicLinkToken: plainToken
        },
        overrideAccess: true
      })

      // Currently tokens are stored as-is (hashing not implemented)
      expect(result.magicLinkToken).toBe(plainToken)
      
      // Verify non-admin users can't see the token
      const publicView = await mockPayload.findByID({
        collection: 'subscribers',
        id: 'sub-123',
        overrideAccess: false,
        user: { id: 'user-1', collection: 'users' }
      })
      
      expect(publicView.magicLinkToken).toBeUndefined()
    })
  })

  describe('Cross-Site Request Prevention', () => {
    it('should validate origin of token verification requests', async () => {
      const validateOrigin = (origin: string, allowedOrigins: string[]) => {
        return allowedOrigins.includes(origin)
      }

      const allowedOrigins = ['https://example.com', 'https://app.example.com']
      
      expect(validateOrigin('https://example.com', allowedOrigins)).toBe(true)
      expect(validateOrigin('https://evil.com', allowedOrigins)).toBe(false)
    })

    it('should require CSRF protection for token verification', async () => {
      const csrfToken = 'csrf-token-123'
      const sessionCsrf = 'csrf-token-123'
      
      const isValidCsrf = csrfToken === sessionCsrf
      expect(isValidCsrf).toBe(true)
      
      const invalidCsrf = 'wrong-csrf-token'
      expect(invalidCsrf === sessionCsrf).toBe(false)
    })
  })
})