import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock JWT utils before imports
vi.mock('../../../utils/jwt')

import { createVerifyMagicLinkEndpoint } from '../../../endpoints/verify-magic-link'
import { createPayloadRequestMock, clearCollections, seedCollection } from '../../mocks/payload'
import { mockSubscribers } from '../../fixtures/subscribers'
import { verifyMagicLinkToken, generateSessionToken } from '../../../utils/jwt'

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
      body: {},
      headers: {},
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn().mockReturnThis(),
    }
    
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should reject requests without a token', async () => {
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token is required',
      })
    })

    it('should reject invalid tokens', async () => {
      vi.mocked(verifyMagicLinkToken).mockImplementation(() => {
        throw new Error('Invalid or expired token')
      })

      mockReq.body = { token: 'invalid-token' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      })
    })

    it('should reject tokens for non-existent subscribers', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'non-existent',
        email: 'ghost@example.com',
        type: 'magic-link' as const,
      })

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Subscriber not found',
      })
    })

    it('should reject tokens with mismatched email', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'sub-1',
        email: 'wrong@example.com', // Doesn't match subscriber email
        type: 'magic-link' as const,
      })

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      })
    })

    it('should reject unsubscribed users', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'sub-3', // Unsubscribed user
        email: 'unsubscribed@example.com',
        type: 'magic-link' as const,
      })

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'This email has been unsubscribed',
      })
    })
  })

  describe('Successful Verification', () => {
    it('should activate pending subscribers', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'sub-2', // Pending subscriber
        email: 'pending@example.com',
        type: 'magic-link' as const,
      })
      vi.mocked(generateSessionToken).mockReturnValue('session-token-123')

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
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
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        sessionToken: 'session-token-123',
        subscriber: expect.objectContaining({
          id: 'sub-2',
          email: 'pending@example.com',
        }),
      })
    })

    it('should clear magic link tokens after use', async () => {
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'sub-2',
        email: 'pending@example.com',
        type: 'magic-link' as const,
      })
      vi.mocked(generateSessionToken).mockReturnValue('session-token-123')

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
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
      vi.mocked(verifyMagicLinkToken).mockReturnValue({
subscriberId: 'sub-1',
        email: 'active@example.com',
        type: 'magic-link' as const,
      })
      vi.mocked(generateSessionToken).mockReturnValue('session-token-123')

      mockReq.body = { token: 'valid-token' }
      await endpoint.handler(mockReq, mockRes)
      
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