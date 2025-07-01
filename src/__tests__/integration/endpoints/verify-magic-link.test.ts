// Set environment variables before any imports
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PAYLOAD_SECRET = 'test-payload-secret'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createVerifyMagicLinkEndpoint } from '../../../endpoints/verify-magic-link'
import { createPayloadRequestMock, clearCollections, seedCollection } from '../../mocks/payload'
import { mockSubscribers } from '../../fixtures/subscribers'
import { generateMagicLinkToken, generateSessionToken } from '../../../utils/jwt'

describe('Verify Magic Link Endpoint', () => {
  let endpoint: any
  let mockReq: any
  let mockRes: any
  const config = {
    subscribersSlug: 'subscribers',
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', mockSubscribers)
    
    endpoint = createVerifyMagicLinkEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      data: {},
      headers: new Headers(),
    }
    
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should reject requests without a token', async () => {
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Token is required',
      })
    })

    it('should reject invalid tokens', async () => {
      mockReq.data = { token: 'invalid-token' }
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid magic link token',
      })
    })

    it('should reject tokens for non-existent subscribers', async () => {
      // Create a token for non-existent subscriber
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('non-existent', 'ghost@example.com', config)

      mockReq.data = { token }
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Subscriber not found',
      })
    })

    it('should reject tokens with mismatched email', async () => {
      // Create a token with wrong email
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('sub-1', 'wrong@example.com', config)

      mockReq.data = { token }
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid token',
      })
    })

    it('should reject unsubscribed users', async () => {
      // Create a token for unsubscribed user
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('sub-3', 'unsubscribed@example.com', config)

      mockReq.data = { token }
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(403)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'This email has been unsubscribed',
      })
    })
  })

  describe('Successful Verification', () => {
    it('should activate pending subscribers', async () => {
      // Create a valid token for pending subscriber
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('sub-2', 'pending@example.com', config)

      mockReq.data = { token }
      const response = await endpoint.handler(mockReq)
      
      // Check that update was called with correct params
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-2',
        data: {
          subscriptionStatus: 'active',
        },
        overrideAccess: false,
        user: {
          collection: 'subscribers',
          id: 'sub-2',
          email: 'pending@example.com',
        },
      })
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: true,
        sessionToken: expect.any(String),
        subscriber: expect.objectContaining({
          id: 'sub-2',
          email: 'pending@example.com',
        }),
      })
    })

    it('should clear magic link tokens after use', async () => {
      // Create a valid token for pending subscriber
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('sub-2', 'pending@example.com', config)

      mockReq.data = { token }
      await endpoint.handler(mockReq)
      
      // Check token clearing
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-2',
        data: {
          magicLinkToken: null,
          magicLinkTokenExpiry: null,
        },
        overrideAccess: false,
        user: expect.any(Object),
      })
    })

    it('should generate synthetic user for operations', async () => {
      // Create a valid token for active subscriber
      const config = { subscribersSlug: 'subscribers' }
      const token = generateMagicLinkToken('sub-1', 'active@example.com', config)

      mockReq.data = { token }
      await endpoint.handler(mockReq)
      
      // Verify synthetic user structure in all update calls
      const updateCalls = (mockReq.payload.update as any).mock.calls
      updateCalls.forEach((call: any) => {
        expect(call[0].user).toEqual({
          collection: 'subscribers',
          id: 'sub-1',
          email: 'active@example.com',
        })
      })
    })
  })
})