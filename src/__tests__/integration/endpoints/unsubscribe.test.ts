import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createUnsubscribeEndpoint } from '../../../endpoints/unsubscribe'
import { createPayloadRequestMock, seedCollection, clearCollections, createMockUser } from '../../mocks/payload'
import { mockSubscribers } from '../../fixtures/subscribers'
import type { NewsletterPluginConfig } from '../../../types'

describe('Unsubscribe Endpoint Security', () => {
  let endpoint: any
  let mockReq: any
  let mockRes: any
  const config: NewsletterPluginConfig = {
    subscribersSlug: 'subscribers',
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', mockSubscribers)
    
    endpoint = createUnsubscribeEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      body: {},
      user: null,
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    
    vi.clearAllMocks()
  })

  describe('Authentication Required', () => {
    it('should reject unauthenticated requests', async () => {
      mockReq.body = { subscriberId: 'sub-1' }
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should reject requests without subscriber ID', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Subscriber ID is required',
      })
    })
  })

  describe('Access Control', () => {
    it('should allow subscribers to unsubscribe themselves', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-1' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-1',
        data: {
          subscriptionStatus: 'unsubscribed',
          unsubscribedAt: expect.any(Date),
        },
        overrideAccess: false,
        user: mockReq.user,
      })
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should prevent subscribers from unsubscribing others', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-2' } // Trying to unsubscribe someone else
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'You can only unsubscribe yourself',
      })
    })

    it('should prevent regular users from unsubscribing subscribers', async () => {
      mockReq.user = createMockUser({ id: 'user-123' })
      mockReq.body = { subscriberId: 'sub-1' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid user type for this operation',
      })
    })
  })

  describe('Already Unsubscribed', () => {
    it('should handle already unsubscribed users gracefully', async () => {
      mockReq.user = {
        id: 'sub-3', // Already unsubscribed
        email: 'unsubscribed@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-3' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Already unsubscribed',
      })
      
      // Should not call update
      expect(mockReq.payload.update).not.toHaveBeenCalled()
    })
  })

  describe('Non-existent Subscribers', () => {
    it('should handle non-existent subscriber IDs', async () => {
      mockReq.user = {
        id: 'sub-999',
        email: 'ghost@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-999' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Subscriber not found',
      })
    })
  })

  describe('Data Integrity', () => {
    it('should set unsubscribedAt timestamp', async () => {
      const beforeTime = new Date()
      
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-1' }
      
      await endpoint.handler(mockReq, mockRes)
      
      const updateCall = mockReq.payload.update.mock.calls[0][0]
      const unsubscribedAt = new Date(updateCall.data.unsubscribedAt)
      const afterTime = new Date()
      
      // Verify timestamp is between test start and end
      expect(unsubscribedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(unsubscribedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should clear email preferences on unsubscribe', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = { subscriberId: 'sub-1' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailPreferences: {
              newsletter: false,
              announcements: false,
            },
          }),
        })
      )
    })
  })
})