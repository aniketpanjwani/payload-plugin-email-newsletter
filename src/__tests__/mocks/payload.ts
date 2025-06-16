import { vi } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'
import { sanitizeInput } from '../../utils/validation'

// Mock collection data storage
const collections = new Map<string, Map<string, any>>()

// Initialize collections
collections.set('subscribers', new Map())
collections.set('newsletter-settings', new Map())
collections.set('users', new Map())

// Helper to filter sensitive fields based on user permissions
const filterSensitiveFields = (doc: any, collection: string, user: any, overrideAccess: boolean = false): any => {
  if (!doc) return doc
  
  // If access is overridden, return everything
  if (overrideAccess) {
    return doc
  }
  
  const filtered = { ...doc }
  
  // For subscribers collection
  if (collection === 'subscribers') {
    // Non-admin users shouldn't see sensitive fields
    if (!user?.roles?.includes('admin')) {
      delete filtered.magicLinkToken
      delete filtered.magicLinkTokenExpiry
      delete filtered.magicLinkUsedAt
      delete filtered.signupMetadata
    }
  }
  
  // For newsletter settings
  if (collection === 'newsletter-settings') {
    // Currently API keys are not hidden (field-level access control not implemented)
    // This matches the actual behavior
  }
  
  return filtered
}

// Create mock Payload instance
export const createPayloadMock = (): any => {
  return {
    collections: {
      subscribers: {
        slug: 'subscribers',
        config: {
          slug: 'subscribers',
          access: {},
          fields: [],
        },
      },
      'newsletter-settings': {
        slug: 'newsletter-settings',
        config: {
          slug: 'newsletter-settings',
          access: {},
          fields: [],
        },
      },
      users: {
        slug: 'users',
        config: {
          slug: 'users',
          access: {},
          fields: [],
        },
      },
    },
    create: vi.fn(async ({ collection, data, user, overrideAccess = true }) => {
      const collectionData = collections.get(collection)
      if (!collectionData) {
        throw new Error(`Collection ${collection} not found`)
      }

      // Simulate access control
      if (!overrideAccess) {
        // Newsletter settings require admin for create operations
        if (collection === 'newsletter-settings') {
          if (!user || !user.roles?.includes('admin')) {
            throw new Error('Unauthorized')
          }
          // Don't enforce singleton pattern here - that's done in hooks
        } else if (!user) {
          throw new Error('Unauthorized')
        }
      }

      const id = `${collection}-${Date.now()}-${Math.random()}`
      
      // Sanitize subscriber data
      let processedData = { ...data }
      if (collection === 'subscribers' && data.name) {
        processedData.name = sanitizeInput(data.name)
      }
      // Sanitize custom fields if present
      if (data.customField) {
        processedData.customField = sanitizeInput(data.customField)
      }
      
      const doc = {
        id,
        ...processedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      collectionData.set(id, doc)
      return doc
    }),
    find: vi.fn(async ({ collection, where, user, overrideAccess = true }) => {
      const collectionData = collections.get(collection)
      if (!collectionData) {
        throw new Error(`Collection ${collection} not found`)
      }

      // Simulate access control
      if (!overrideAccess) {
        // Newsletter settings can be read publicly - no restrictions for read access
        if (collection === 'newsletter-settings') {
          // Public read access, no restrictions
        }
        // Users collection - subscribers cannot access
        else if (collection === 'users') {
          if (user?.collection === 'subscribers') {
            throw new Error('Unauthorized')
          }
          if (!user) {
            throw new Error('Unauthorized')
          }
        }
        // Subscribers can only see their own data
        else if (collection === 'subscribers' && user?.collection === 'subscribers') {
          // Will filter below to only show own data
        }
        // Other collections require authentication
        else if (collection === 'subscribers' && !user) {
          throw new Error('Unauthorized')
        }
      }

      let docs = Array.from(collectionData.values())

      // Apply access control filters
      if (!overrideAccess && collection === 'subscribers' && user?.collection === 'subscribers') {
        // Subscribers can only see their own data
        docs = docs.filter(doc => doc.id === user.id)
      }

      // Simple where clause implementation
      if (where) {
        docs = docs.filter(doc => {
          return Object.entries(where).every(([key, value]) => {
            // Handle nested fields like 'signupMetadata.ipAddress'
            const keys = key.split('.')
            let fieldValue = doc
            for (const k of keys) {
              fieldValue = fieldValue?.[k]
              if (fieldValue === undefined) break
            }
            
            if (typeof value === 'object' && value !== null && 'equals' in value) {
              return fieldValue === (value as any).equals
            }
            return fieldValue === value
          })
        })
      }

      // Filter sensitive fields from results
      const filteredDocs = docs.map(doc => filterSensitiveFields(doc, collection, user, overrideAccess))

      return {
        docs: filteredDocs,
        totalDocs: filteredDocs.length,
        limit: 10,
        totalPages: 1,
        page: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
    }),
    findByID: vi.fn(async ({ collection, id, user, overrideAccess = true }) => {
      const collectionData = collections.get(collection)
      if (!collectionData) {
        throw new Error(`Collection ${collection} not found`)
      }

      // Simulate access control
      if (!overrideAccess) {
        // Newsletter settings can be read publicly
        if (collection === 'newsletter-settings') {
          // Public read access allowed
        }
        // Subscribers can only read their own data
        else if (collection === 'subscribers') {
          if (!user) {
            throw new Error('Unauthorized')
          }
          if (user.collection === 'subscribers' && user.id !== id) {
            return null
          }
        }
        // Other collections require authentication
        else if (!user) {
          throw new Error('Unauthorized')
        }
      }

      const doc = collectionData.get(id)
      if (!doc) return null
      
      // Filter sensitive fields based on permissions
      return filterSensitiveFields(doc, collection, user, overrideAccess)
    }),
    update: vi.fn(async ({ collection, id, data, user, overrideAccess = true }) => {
      const collectionData = collections.get(collection)
      if (!collectionData) {
        throw new Error(`Collection ${collection} not found`)
      }

      // Simulate access control
      if (!overrideAccess) {
        // Newsletter settings require admin for write operations
        if (collection === 'newsletter-settings') {
          if (!user || !user.roles?.includes('admin')) {
            throw new Error('Unauthorized')
          }
        } 
        // Subscribers can only update their own data
        else if (collection === 'subscribers') {
          if (!user) {
            throw new Error('Unauthorized')
          }
          if (user.collection === 'subscribers' && user.id !== id) {
            throw new Error('Unauthorized')
          }
          // Subscribers cannot modify protected fields
          if (user.collection === 'subscribers') {
            const protectedFields = ['email', 'emailProviderId', 'signupMetadata']
            const hasProtectedField = protectedFields.some(field => field in data)
            if (hasProtectedField) {
              throw new Error('Cannot modify protected fields')
            }
            // Special case: allow clearing magic link tokens (setting to null)
            if ('magicLinkToken' in data && data.magicLinkToken !== null) {
              throw new Error('Cannot modify magic link token')
            }
            if ('magicLinkTokenExpiry' in data && data.magicLinkTokenExpiry !== null) {
              throw new Error('Cannot modify magic link token expiry')
            }
            // Special case: allow subscribers to unsubscribe themselves or activate pending status
            if (data.subscriptionStatus && data.subscriptionStatus !== 'unsubscribed' && data.subscriptionStatus !== 'active') {
              throw new Error('Cannot modify subscription status except to unsubscribe or activate')
            }
          }
        }
        else if (!user) {
          throw new Error('Unauthorized')
        }
      }

      const existing = collectionData.get(id)
      if (!existing) {
        throw new Error(`Document ${id} not found in ${collection}`)
      }

      // Sanitize subscriber data on update
      let processedData = { ...data }
      if (collection === 'subscribers' && data.name) {
        processedData.name = sanitizeInput(data.name)
      }
      // Sanitize custom fields if present
      if (data.customField) {
        processedData.customField = sanitizeInput(data.customField)
      }
      
      // Encrypt API keys for newsletter settings
      if (collection === 'newsletter-settings' && data.providerApiKey) {
        processedData.providerApiKey = `encrypted:${Buffer.from(data.providerApiKey).toString('base64')}`
      }

      const updated = {
        ...existing,
        ...processedData,
        updatedAt: new Date().toISOString(),
      }
      collectionData.set(id, updated)
      return updated
    }),
    delete: vi.fn(async ({ collection, id, user, overrideAccess = true }) => {
      const collectionData = collections.get(collection)
      if (!collectionData) {
        throw new Error(`Collection ${collection} not found`)
      }

      // Simulate access control
      if (!overrideAccess) {
        // Newsletter settings require admin for delete operations
        if (collection === 'newsletter-settings') {
          if (!user || !user.roles?.includes('admin')) {
            throw new Error('Unauthorized')
          }
          // Even admins shouldn't delete settings in practice, but access control allows it
        } 
        // Subscribers can only delete their own data
        else if (collection === 'subscribers') {
          if (!user) {
            throw new Error('Unauthorized')
          }
          if (user.collection === 'subscribers' && user.id !== id) {
            throw new Error('Unauthorized')
          }
        }
        else if (!user) {
          throw new Error('Unauthorized')
        }
      }

      const existing = collectionData.get(id)
      if (!existing) {
        throw new Error(`Document ${id} not found in ${collection}`)
      }

      collectionData.delete(id)
      return existing
    }),
    email: {
      sendEmail: vi.fn(async (options) => {
        // Mock email sending
        return { success: true }
      }),
    },
  }
}

// Create mock PayloadRequest
export const createPayloadRequestMock = (
  overrides: Partial<PayloadRequest> = {}
): Partial<PayloadRequest> => {
  const payload = createPayloadMock()
  
  return {
    payload: payload as Payload,
    user: null,
    locale: 'en',
    fallbackLocale: 'en',
    context: {},
    ...overrides,
  }
}

// Test helpers
export const getCollectionData = (collection: string) => {
  return Array.from(collections.get(collection)?.values() || [])
}

export const clearCollections = () => {
  collections.forEach(collection => collection.clear())
}

export const seedCollection = (collection: string, docs: any[]) => {
  const collectionData = collections.get(collection)
  if (collectionData) {
    docs.forEach(doc => {
      collectionData.set(doc.id, doc)
    })
  }
}

// Mock user helpers
export const createMockUser = (overrides: any = {}) => {
  return {
    id: 'user-123',
    email: 'test@example.com',
    collection: 'users',
    ...overrides,
  }
}

export const createMockAdminUser = (overrides: any = {}) => {
  return {
    id: 'admin-123',
    email: 'admin@example.com',
    collection: 'users',
    roles: ['admin'],
    ...overrides,
  }
}

export const createMockNonAdminUser = (overrides: any = {}) => {
  return {
    id: 'user-456',
    email: 'user@example.com',
    collection: 'users',
    roles: ['user'],
    ...overrides,
  }
}