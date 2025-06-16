import { describe, it, expect } from 'vitest'
import { isAdmin } from '../../../utils/access'
import type { NewsletterPluginConfig } from '../../../types'
import { createTestConfig } from '../../utils/test-config'

describe('Access Control Utilities', () => {
  describe('isAdmin', () => {
    it('should return false for non-user collections', () => {
      const subscriber = {
        id: 'sub-123',
        email: 'test@example.com',
        collection: 'subscribers',
      }
      expect(isAdmin(subscriber)).toBe(false)
    })

    it('should return false for null or undefined user', () => {
      expect(isAdmin(null)).toBe(false)
      expect(isAdmin(undefined)).toBe(false)
    })

    it('should detect admin via roles array', () => {
      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        collection: 'users',
        roles: ['admin', 'editor'],
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should detect admin via isAdmin boolean', () => {
      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        collection: 'users',
        isAdmin: true,
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should detect admin via role string', () => {
      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        collection: 'users',
        role: 'admin',
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should detect admin via admin boolean', () => {
      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        collection: 'users',
        admin: true,
      }
      expect(isAdmin(user)).toBe(true)
    })

    it('should return false for non-admin users', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        collection: 'users',
        roles: ['editor', 'viewer'],
        isAdmin: false,
        role: 'editor',
        admin: false,
      }
      expect(isAdmin(user)).toBe(false)
    })

    it('should use custom isAdmin function when provided', () => {
      const config = createTestConfig({
        access: {
          isAdmin: (user) => user?.customRole === 'super-admin',
        },
      })

      const regularAdmin = {
        id: 'user-123',
        email: 'admin@example.com',
        collection: 'users',
        roles: ['admin'],
      }
      expect(isAdmin(regularAdmin, config)).toBe(false)

      const customAdmin = {
        id: 'user-456',
        email: 'super@example.com',
        collection: 'users',
        customRole: 'super-admin',
      }
      expect(isAdmin(customAdmin, config)).toBe(true)
    })

    it('should handle edge cases gracefully', () => {
      // Empty user object
      const emptyUser = { collection: 'users' }
      expect(isAdmin(emptyUser)).toBe(false)

      // User with empty roles array
      const userWithEmptyRoles = {
        collection: 'users',
        roles: [],
      }
      expect(isAdmin(userWithEmptyRoles)).toBe(false)

      // User with non-admin role string
      const userWithNonAdminRole = {
        collection: 'users',
        role: 'viewer',
      }
      expect(isAdmin(userWithNonAdminRole)).toBe(false)
    })
  })
})