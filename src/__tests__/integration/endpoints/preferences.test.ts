import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPreferencesEndpoint } from '../../../endpoints/preferences'
import { createPayloadRequestMock, seedCollection, clearCollections, createMockUser, createMockAdminUser } from '../../mocks/payload'
import { mockSubscribers } from '../../fixtures/subscribers'
import type { NewsletterPluginConfig } from '../../../types'

describe('Preferences Endpoint Security', () => {
  let endpoint: any
  let mockReq: any
  let mockRes: any
  const config: NewsletterPluginConfig = {
    subscribersSlug: 'subscribers',
  }

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', mockSubscribers)
    
    endpoint = createPreferencesEndpoint(config)
    const payloadMock = createPayloadRequestMock()
    
    mockReq = {
      payload: payloadMock.payload,
      body: {},
      user: null,
      method: 'GET',
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    
    vi.clearAllMocks()
  })

  describe('GET - Read Preferences', () => {
    it('should require authentication', async () => {
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should allow subscribers to read their own preferences', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        preferences: expect.objectContaining({
          email: 'active@example.com',
          emailPreferences: {
            newsletter: true,
            announcements: true,
          },
        }),
      })
    })

    it('should prevent reading other subscribers preferences', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.query = { subscriberId: 'sub-2' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'You can only access your own preferences',
      })
    })

    it('should allow admins to read any preferences', async () => {
      mockReq.user = createMockAdminUser()
      mockReq.query = { subscriberId: 'sub-2' }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        preferences: expect.objectContaining({
          email: 'pending@example.com',
        }),
      })
    })
  })

  describe('POST - Update Preferences', () => {
    beforeEach(() => {
      mockReq.method = 'POST'
    })

    it('should require authentication', async () => {
      mockReq.body = {
        emailPreferences: {
          newsletter: false,
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      })
    })

    it('should allow subscribers to update their own preferences', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = {
        emailPreferences: {
          newsletter: false,
          announcements: true,
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockReq.payload.update).toHaveBeenCalledWith({
        collection: 'subscribers',
        id: 'sub-1',
        data: {
          emailPreferences: {
            newsletter: false,
            announcements: true,
          },
        },
        overrideAccess: false,
        user: mockReq.user,
      })
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should prevent updating other subscribers preferences', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = {
        subscriberId: 'sub-2',
        emailPreferences: {
          newsletter: false,
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'You can only update your own preferences',
      })
    })

    it('should validate preference structure', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = {
        emailPreferences: {
          newsletter: 'yes', // Should be boolean
          unknownField: true, // Should be filtered out
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid preference values',
      })
    })

    it('should prevent updating protected fields', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      mockReq.body = {
        email: 'newemail@example.com', // Should not be allowed
        subscriptionStatus: 'active', // Should not be allowed
        emailPreferences: {
          newsletter: false,
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      // Should only update emailPreferences
      expect(mockReq.payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            emailPreferences: {
              newsletter: false,
              announcements: true, // Preserves existing value
            },
          },
        })
      )
      
      // Should not include protected fields
      const updateData = mockReq.payload.update.mock.calls[0][0].data
      expect(updateData).not.toHaveProperty('email')
      expect(updateData).not.toHaveProperty('subscriptionStatus')
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent subscribers', async () => {
      mockReq.user = {
        id: 'sub-999',
        email: 'ghost@example.com',
        collection: 'subscribers',
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Subscriber not found',
      })
    })

    it('should handle database errors gracefully', async () => {
      mockReq.user = {
        id: 'sub-1',
        email: 'active@example.com',
        collection: 'subscribers',
      }
      
      mockReq.payload.findByID.mockRejectedValueOnce(new Error('Database error'))
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve preferences',
      })
    })
  })

  describe('Unsubscribed Users', () => {
    it('should allow unsubscribed users to view preferences', async () => {
      mockReq.user = {
        id: 'sub-3',
        email: 'unsubscribed@example.com',
        collection: 'subscribers',
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        preferences: expect.objectContaining({
          subscriptionStatus: 'unsubscribed',
        }),
      })
    })

    it('should prevent unsubscribed users from updating preferences', async () => {
      mockReq.method = 'POST'
      mockReq.user = {
        id: 'sub-3',
        email: 'unsubscribed@example.com',
        collection: 'subscribers',
      }
      mockReq.body = {
        emailPreferences: {
          newsletter: true,
        },
      }
      
      await endpoint.handler(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot update preferences for unsubscribed users',
      })
    })
  })
})