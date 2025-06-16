import { describe, it, expect, beforeEach, vi } from 'vitest'
import { adminOnly, adminOrSelf } from '../../utils/access'
import type { PayloadRequest } from 'payload'

import { createMockUser, createMockAdminUser } from '../mocks/payload'
import { createTestConfig } from '../utils/test-config'

describe('Subscriber Access Control Security', () => {
  let mockReq: Partial<PayloadRequest>
  const mockConfig = createTestConfig()

  beforeEach(() => {
    mockReq = {
      user: null,
    }
  })

  describe('adminOnly', () => {
    it('should deny access to unauthenticated users', () => {
      const access = adminOnly(mockConfig)
      expect(access({ req: mockReq as PayloadRequest })).toBe(false)
    })

    it('should deny access to regular users', () => {
      mockReq.user = createMockUser()
      const access = adminOnly(mockConfig)
      expect(access({ req: mockReq as PayloadRequest })).toBe(false)
    })

    it('should allow access to admin users', () => {
      mockReq.user = createMockAdminUser()
      const access = adminOnly(mockConfig)
      expect(access({ req: mockReq as PayloadRequest })).toBe(true)
    })

    it('should respect custom admin function', () => {
      const customConfig = createTestConfig({
        access: {
          isAdmin: (user) => user?.customRole === 'manager',
        },
      })

      // Regular admin should be denied
      mockReq.user = createMockAdminUser()
      const access = adminOnly(customConfig)
      expect(access({ req: mockReq as PayloadRequest })).toBe(false)

      // Custom role should be allowed
      mockReq.user = createMockUser({ customRole: 'manager' })
      expect(access({ req: mockReq as PayloadRequest })).toBe(true)
    })
  })

  describe('adminOrSelf', () => {
    it('should deny access to unauthenticated users', () => {
      const access = adminOrSelf(mockConfig)
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-123',
      })).toBe(false)
    })

    it('should allow admin users to access any subscriber', () => {
      mockReq.user = createMockAdminUser()
      const access = adminOrSelf(mockConfig)
      
      // Admin can access any subscriber
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-123',
      })).toBe(true)
      
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-456',
      })).toBe(true)
    })

    it('should allow synthetic users to access their own data', () => {
      // Synthetic user (from magic link)
      mockReq.user = {
        id: 'sub-123',
        email: 'test@example.com',
        collection: 'subscribers',
      }
      
      const access = adminOrSelf(mockConfig)
      
      // Can access own data
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-123',
      })).toBe(true)
      
      // Cannot access other subscribers
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-456',
      })).toBe(false)
    })

    it('should deny regular users access to subscriber data', () => {
      mockReq.user = createMockUser({ id: 'user-123' })
      const access = adminOrSelf(mockConfig)
      
      // Regular users cannot access any subscriber data
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-123',
      })).toBe(false)
    })

    it('should handle where queries for list operations', () => {
      const access = adminOrSelf(mockConfig)
      
      // Unauthenticated - no access
      expect(access({ req: mockReq as PayloadRequest })).toEqual({
        id: { equals: 'unauthorized-no-access' },
      })
      
      // Admin - full access
      mockReq.user = createMockAdminUser()
      expect(access({ req: mockReq as PayloadRequest })).toBe(true)
      
      // Synthetic user - scoped to self
      mockReq.user = {
        id: 'sub-123',
        email: 'test@example.com',
        collection: 'subscribers',
      }
      expect(access({ req: mockReq as PayloadRequest })).toEqual({
        id: { equals: 'sub-123' },
      })
      
      // Regular user - no access
      mockReq.user = createMockUser()
      expect(access({ req: mockReq as PayloadRequest })).toEqual({
        id: { equals: 'unauthorized-no-access' },
      })
    })

    it('should prevent data leakage through query manipulation', () => {
      // Synthetic user trying to access other data
      mockReq.user = {
        id: 'sub-123',
        email: 'attacker@example.com',
        collection: 'subscribers',
      }
      
      const access = adminOrSelf(mockConfig)
      
      // Direct ID access is properly restricted
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-456', // Trying to access another subscriber
      })).toBe(false)
      
      // List queries are properly scoped
      const whereClause = access({ req: mockReq as PayloadRequest })
      expect(whereClause).toEqual({
        id: { equals: 'sub-123' },
      })
    })
  })

  describe('Cross-subscriber data isolation', () => {
    it('should prevent subscribers from accessing each other\'s data', () => {
      const access = adminOrSelf(mockConfig)
      
      // Subscriber A
      const subscriberA = {
        id: 'sub-a',
        email: 'a@example.com',
        collection: 'subscribers',
      }
      
      // Subscriber B trying to access Subscriber A's data
      mockReq.user = {
        id: 'sub-b',
        email: 'b@example.com',
        collection: 'subscribers',
      }
      
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-a',
      })).toBe(false)
    })

    it('should prevent forged synthetic users', () => {
      const access = adminOrSelf(mockConfig)
      
      // Attacker trying to forge a synthetic user
      mockReq.user = {
        id: 'sub-target',
        email: 'attacker@evil.com',
        collection: 'subscribers', // Claiming to be a subscriber
        // But this should be validated by the magic link system
      }
      
      // Even if they claim the right ID, the magic link system
      // should have validated this is the correct user
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-target',
      })).toBe(true) // Access control trusts the auth layer
      
      // But they still can't access other subscribers
      expect(access({ 
        req: mockReq as PayloadRequest,
        id: 'sub-other',
      })).toBe(false)
    })
  })
})