import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUnsubscribeEndpoint } from '../../../endpoints/unsubscribe'
import { createPayloadRequestMock, clearCollections } from '../../mocks/payload'
// import { mockSubscribers } from '../../fixtures/subscribers'

// Mock jsonwebtoken before imports
const mockJwt = {
  verify: vi.fn(),
  sign: vi.fn()
}

vi.mock('jsonwebtoken', () => mockJwt)

// Mock console.error to capture errors
// const originalConsoleError = console.error
// beforeAll(() => {
//   console.error = vi.fn()
// })
// afterAll(() => {
//   console.error = originalConsoleError
// })

describe('Unsubscribe Endpoint Security', () => {
  let endpoint: any
  let mockReq: any
  let mockRes: any
  const config = {
    subscribersSlug: 'subscribers',
  }

  beforeEach(() => {
    clearCollections()
    // seedCollection('subscribers', mockSubscribers)
    
    endpoint = createUnsubscribeEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      body: {},
      user: null,
      headers: {},
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    
    vi.clearAllMocks()
  })

  describe('Request Validation', () => {
    it('should reject requests without email or token', async () => {
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email or token is required',
      })
    })

    it('should handle email-based unsubscribe', async () => {
      mockReq.body = { email: 'active@example.com' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-1',
        data: {
          subscriptionStatus: 'unsubscribed',
          unsubscribedAt: expect.any(String),
        },
        overrideAccess: false,
        user: {
          collection: 'subscribers',
          id: 'sub-1',
          email: 'active@example.com',
        },
      })
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully unsubscribed',
      })
    })
  })

  describe('Token-based Unsubscribe', () => {
    it('should handle valid unsubscribe tokens', async () => {
      // Mock JWT verification
      mockJwt.verify.mockReturnValue({
        type: 'unsubscribe',
        subscriberId: 'sub-1',
      })
      
      mockReq.body = { token: 'valid-unsubscribe-token' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-1',
        data: {
          subscriptionStatus: 'unsubscribed',
          unsubscribedAt: expect.any(String),
        },
        overrideAccess: false,
        user: {
          collection: 'subscribers',
          id: 'sub-1',
          email: 'active@example.com',
        },
      })
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully unsubscribed',
      })
    })

    it('should reject invalid tokens', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })
      
      mockReq.body = { token: 'invalid-token' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired unsubscribe link',
      })
    })

    it('should reject non-unsubscribe token types', async () => {
      mockJwt.verify.mockReturnValue({
        type: 'session', // Wrong type
        subscriberId: 'sub-1',
      })
      
      mockReq.body = { token: 'wrong-type-token' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired unsubscribe link',
      })
    })
  })

  describe('Already Unsubscribed', () => {
    it('should handle already unsubscribed users gracefully', async () => {
      mockReq.body = { email: 'unsubscribed@example.com' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Already unsubscribed',
      })
      
      // Should not call update
      expect(mockReq.payload.update).not.toHaveBeenCalled()
    })
  })

  describe('Non-existent Subscribers', () => {
    it('should handle non-existent emails', async () => {
      mockReq.body = { email: 'ghost@example.com' }
      
      await endpoint.handler(mockReq, mockRes)
      
      // The endpoint doesn't reveal if email exists or not for security
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'If this email was subscribed, it has been unsubscribed.',
      })
    })
  })

  describe('Data Integrity', () => {
    it('should set unsubscribedAt timestamp', async () => {
      const beforeTime = new Date()
      
      mockReq.body = { email: 'active@example.com' }
      
      await endpoint.handler(mockReq, mockRes)
      
      const updateCall = mockReq.payload.update.mock.calls[0][0]
      const unsubscribedAt = new Date(updateCall.data.unsubscribedAt)
      const afterTime = new Date()
      
      // Verify timestamp is between test start and end
      expect(unsubscribedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(unsubscribedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should update subscriber status on unsubscribe', async () => {
      mockReq.body = { email: 'active@example.com' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'subscribers',
          id: 'sub-1',
          data: expect.objectContaining({
            subscriptionStatus: 'unsubscribed',
            unsubscribedAt: expect.any(String),
          }),
          overrideAccess: false,
          user: expect.objectContaining({
            collection: 'subscribers',
            id: 'sub-1',
            email: 'active@example.com',
          }),
        })
      )
    })
  })
})