// Set environment variables before any imports
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PAYLOAD_SECRET = 'test-payload-secret'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUnsubscribeEndpoint } from '../../../endpoints/unsubscribe'
import { createPayloadRequestMock, clearCollections, seedCollection } from '../../mocks/payload'
import { mockSubscribers } from '../../fixtures/subscribers'

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
  const config = {
    subscribersSlug: 'subscribers',
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', mockSubscribers)
    
    endpoint = createUnsubscribeEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      data: {},
      json: async () => mockReq.data,
      user: null,
      headers: new Headers(),
    }
    
    vi.clearAllMocks()
  })

  describe('Request Validation', () => {
    it('should reject requests without email or token', async () => {
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Email or token is required',
      })
    })

    it('should handle email-based unsubscribe', async () => {
      mockReq.data = { email: 'active@example.com' }
      
      const response = await endpoint.handler(mockReq)
      
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
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: true,
        message: 'Successfully unsubscribed',
      })
    })
  })

  describe('Token-based Unsubscribe', () => {
    it('should handle valid unsubscribe tokens', async () => {
      // Create a real JWT token for testing
      const jwt = await import('jsonwebtoken')
      const secret = process.env.JWT_SECRET || process.env.PAYLOAD_SECRET || 'test-jwt-secret'
      const token = jwt.sign({
        type: 'unsubscribe',
        subscriberId: 'sub-1',
        email: 'active@example.com'
      }, secret)
      
      mockReq.data = { token }
      
      const response = await endpoint.handler(mockReq)
      const responseData = await response.json()
      
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
      
      expect(responseData).toEqual({
        success: true,
        message: 'Successfully unsubscribed',
      })
    })

    it('should reject invalid tokens', async () => {
      mockReq.data = { token: 'invalid-token' }
      
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid or expired unsubscribe link',
      })
    })

    it('should reject non-unsubscribe token types', async () => {
      // Create a token with wrong type
      const jwt = await import('jsonwebtoken')
      const secret = process.env.JWT_SECRET || 'test-jwt-secret'
      const token = jwt.sign({
        type: 'session', // Wrong type
        subscriberId: 'sub-1',
        email: 'active@example.com'
      }, secret)
      
      mockReq.data = { token }
      
      const response = await endpoint.handler(mockReq)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid or expired unsubscribe link',
      })
    })
  })

  describe('Already Unsubscribed', () => {
    it('should handle already unsubscribed users gracefully', async () => {
      mockReq.data = { email: 'unsubscribed@example.com' }
      
      const response = await endpoint.handler(mockReq)
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: true,
        message: 'Already unsubscribed',
      })
      
      // Should not call update
      expect(mockReq.payload.update).not.toHaveBeenCalled()
    })
  })

  describe('Non-existent Subscribers', () => {
    it('should handle non-existent emails', async () => {
      mockReq.data = { email: 'ghost@example.com' }
      
      const response = await endpoint.handler(mockReq)
      
      // The endpoint doesn't reveal if email exists or not for security
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: true,
        message: 'If this email was subscribed, it has been unsubscribed.',
      })
    })
  })

  describe('Data Integrity', () => {
    it('should set unsubscribedAt timestamp', async () => {
      const beforeTime = new Date()
      
      mockReq.data = { email: 'active@example.com' }
      
      await endpoint.handler(mockReq)
      
      const updateCall = mockReq.payload.update.mock.calls[0][0]
      const unsubscribedAt = new Date(updateCall.data.unsubscribedAt)
      const afterTime = new Date()
      
      // Verify timestamp is between test start and end
      expect(unsubscribedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(unsubscribedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should update subscriber status on unsubscribe', async () => {
      mockReq.data = { email: 'active@example.com' }
      
      await endpoint.handler(mockReq)
      
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