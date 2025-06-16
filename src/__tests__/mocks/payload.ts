import { vi } from 'vitest'
import type { Payload, PayloadRequest } from 'payload'
import { sanitizeInput } from '../../utils/validation'

// Mock collection data storage
const collections = new Map<string, Map<string, any>>()

// Initialize collections
collections.set('subscribers', new Map())
collections.set('newsletter-settings', new Map())
collections.set('users', new Map())

// Create mock Payload instance
export const createPayloadMock = (): Partial<Payload> => {
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
      // Newsletter settings allow public read access
      if (!overrideAccess && !user && collection !== 'newsletter-settings') {
        throw new Error('Unauthorized')
      }

      let docs = Array.from(collectionData.values())

      // Simple where clause implementation
      if (where) {
        docs = docs.filter(doc => {
          return Object.entries(where).every(([key, value]) => {
            if (typeof value === 'object' && value.equals) {
              return doc[key] === value.equals
            }
            return doc[key] === value
          })
        })
      }

      return {
        docs,
        totalDocs: docs.length,
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
      // Newsletter settings allow public read access
      if (!overrideAccess && !user && collection !== 'newsletter-settings') {
        throw new Error('Unauthorized')
      }

      const doc = collectionData.get(id)
      // Return null for non-existent documents (like real Payload)
      return doc || null
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
        } else if (!user) {
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
        } else if (!user) {
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
  } as Partial<Payload>
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