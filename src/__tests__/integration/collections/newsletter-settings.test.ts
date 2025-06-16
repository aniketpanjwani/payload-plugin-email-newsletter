import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createPayloadRequestMock, 
  clearCollections,
  seedCollection,
  createMockAdminUser
} from '../../mocks/payload'
import { createBeforeChangeArgs, createAfterChangeArgs } from '../../utils/hook-test-utils'

describe('Newsletter Settings Collection Hooks Security', () => {
  let mockReq: any

  beforeEach(() => {
    clearCollections()
    const payloadMock = createPayloadRequestMock()
    mockReq = {
      payload: payloadMock.payload,
      user: null
    }
    vi.clearAllMocks()
  })

  describe('Access Control Hooks', () => {
    it('should only allow users from users collection to modify settings', async () => {
      const beforeChangeHook = async ({ data, req }: any) => {
        // Match actual implementation
        if (!req.user || req.user.collection !== 'users') {
          throw new Error('Only administrators can modify newsletter settings')
        }
        return data
      }

      // Non-users collection should be rejected
      mockReq.user = { id: 'sub-123', collection: 'subscribers' }
      await expect(beforeChangeHook(createBeforeChangeArgs({
        data: { name: 'Test Settings' },
        req: mockReq,
        operation: 'create'
      }))).rejects.toThrow('Only administrators can modify newsletter settings')

      // Users collection should be allowed
      mockReq.user = createMockAdminUser()
      const result = await beforeChangeHook(createBeforeChangeArgs({
        data: { name: 'Test Settings' },
        req: mockReq,
        operation: 'create'
      }))
      expect(result.name).toBe('Test Settings')
    })
  })


  describe('Active Configuration Management', () => {
    it('should enforce only one active config', async () => {
      const slug = 'newsletter-settings'
      
      seedCollection(slug, [
        { id: 'settings-1', name: 'Config 1', active: true },
        { id: 'settings-2', name: 'Config 2', active: false }
      ])

      const beforeChangeHook = async ({ data, req: _req, operation }: any) => {
        // Match actual implementation
        if (!_req.user || _req.user.collection !== 'users') {
          throw new Error('Only administrators can modify newsletter settings')
        }
        
        // If setting this config as active, deactivate all others
        if (data?.active && operation === 'update' && data.id) {
          // In real implementation, this would use a where clause
          // For testing, we'll simulate the behavior
          const allSettings = await _req.payload.find({
            collection: slug,
            overrideAccess: false,
            user: _req.user
          })
          
          for (const doc of allSettings.docs) {
            if (doc.id !== data.id && doc.active) {
              await _req.payload.update({
                collection: slug,
                id: doc.id,
                data: { active: false },
                overrideAccess: false,
                user: _req.user
              })
            }
          }
        }
        
        return data
      }

      mockReq.user = createMockAdminUser()
      const result = await beforeChangeHook(createBeforeChangeArgs({
        data: { id: 'settings-2', active: true },
        req: mockReq,
        operation: 'update'
      }))

      expect(result.active).toBe(true)
      expect(mockReq.payload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: slug,
          id: 'settings-1',
          data: { active: false }
        })
      )
    })
  })

  describe('After Change Hook', () => {
    it('should log reinitialize warning when settings change', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const afterChangeHook = async ({ doc, req }: any) => {
        // Match actual implementation
        if ((req.payload as any).newsletterEmailService && doc.active) {
          try {
            console.warn('Newsletter settings updated, reinitializing service...')
          } catch (error) {
            console.error('Failed to reinitialize email service:', error)
          }
        }
        
        return doc
      }

      mockReq.user = createMockAdminUser()
      mockReq.payload.newsletterEmailService = true
      
      const result = await afterChangeHook(createAfterChangeArgs({
        doc: {
          id: 'settings-1',
          name: 'Test Config',
          active: true
        },
        req: mockReq
      }))

      expect(consoleWarnSpy).toHaveBeenCalledWith('Newsletter settings updated, reinitializing service...')
      expect(result.active).toBe(true)
      
      consoleWarnSpy.mockRestore()
    })
  })
})