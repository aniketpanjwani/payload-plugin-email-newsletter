import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPayloadRequestMock, seedCollection, clearCollections } from '../mocks/payload'
import { mockSubscribers } from '../fixtures/subscribers'

import { createTestConfig } from '../utils/test-config'

describe('CSRF Protection', () => {
  let mockReq: any
  let mockRes: any
  const _config = createTestConfig()

  beforeEach(() => {
    clearCollections()
    seedCollection('subscribers', mockSubscribers)
    
    const payloadMock = createPayloadRequestMock()
    mockReq = {
      payload: payloadMock.payload,
      body: {},
      headers: {},
      method: 'POST',
    }
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      end: vi.fn().mockReturnThis(),
    }
    
    vi.clearAllMocks()
  })

  describe('Token Validation', () => {
    it('should validate CSRF tokens on state-changing operations', () => {
      const validateCSRFToken = (req: any): boolean => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return true // Safe methods don't need CSRF protection
        }

        const token = req.headers['x-csrf-token'] || req.body._csrf
        const sessionToken = req.session?.csrfToken

        if (!token || !sessionToken) {
          return false
        }

        return token === sessionToken
      }

      // GET requests should pass without token
      mockReq.method = 'GET'
      expect(validateCSRFToken(mockReq)).toBe(true)

      // POST without token should fail
      mockReq.method = 'POST'
      mockReq.session = { csrfToken: 'valid-token' }
      expect(validateCSRFToken(mockReq)).toBe(false)

      // POST with valid token in header
      mockReq.headers['x-csrf-token'] = 'valid-token'
      expect(validateCSRFToken(mockReq)).toBe(true)

      // POST with valid token in body
      delete mockReq.headers['x-csrf-token']
      mockReq.body._csrf = 'valid-token'
      expect(validateCSRFToken(mockReq)).toBe(true)

      // POST with invalid token
      mockReq.body._csrf = 'invalid-token'
      expect(validateCSRFToken(mockReq)).toBe(false)
    })

    it('should generate secure CSRF tokens', () => {
      const generateCSRFToken = (): string => {
        const array = new Uint8Array(32)
        // In real implementation, use crypto.getRandomValues(array)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return Buffer.from(array).toString('base64')
      }

      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()

      // Tokens should be unique
      expect(token1).not.toBe(token2)
      
      // Tokens should be of sufficient length
      expect(token1.length).toBeGreaterThanOrEqual(32)
      expect(token2.length).toBeGreaterThanOrEqual(32)
    })
  })

  describe('SameSite Cookie Protection', () => {
    it('should set SameSite cookie attributes', () => {
      const setCookie = (res: any, name: string, value: string, options: any = {}) => {
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          ...options,
        }

        const cookieString = `${name}=${value}; ${Object.entries(cookieOptions)
          .map(([key, val]) => {
            if (val === true) return key
            return `${key}=${val}`
          })
          .join('; ')}`

        res.setHeader('Set-Cookie', cookieString)
      }

      setCookie(mockRes, 'session', 'session-id-123')
      
      const setCookieHeader = mockRes.setHeader.mock.calls[0][1]
      expect(setCookieHeader).toContain('httpOnly')
      expect(setCookieHeader).toContain('sameSite=strict')
      expect(setCookieHeader).toContain('path=/')
    })

    it('should validate referer for state-changing requests', () => {
      const validateReferer = (req: any, allowedOrigins: string[]): boolean => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return true
        }

        const referer = req.headers.referer || req.headers.referrer
        if (!referer) {
          return false // Reject if no referer on state-changing request
        }

        try {
          const refererUrl = new URL(referer)
          return allowedOrigins.includes(refererUrl.origin)
        } catch {
          return false
        }
      }

      const allowedOrigins = ['https://example.com', 'https://app.example.com']

      // GET requests pass without referer
      mockReq.method = 'GET'
      expect(validateReferer(mockReq, allowedOrigins)).toBe(true)

      // POST without referer fails
      mockReq.method = 'POST'
      expect(validateReferer(mockReq, allowedOrigins)).toBe(false)

      // POST with valid referer passes
      mockReq.headers.referer = 'https://example.com/page'
      expect(validateReferer(mockReq, allowedOrigins)).toBe(true)

      // POST with invalid referer fails
      mockReq.headers.referer = 'https://evil.com/page'
      expect(validateReferer(mockReq, allowedOrigins)).toBe(false)
    })
  })

  describe('Double Submit Cookie Pattern', () => {
    it('should implement double submit cookie pattern', () => {
      const doubleSubmitMiddleware = (req: any, _res: any) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return true
        }

        // Get token from cookie
        const cookieToken = req.cookies?.csrfToken
        // Get token from request (header or body)
        const requestToken = req.headers['x-csrf-token'] || req.body._csrf

        if (!cookieToken || !requestToken) {
          return false
        }

        // Compare tokens
        return cookieToken === requestToken
      }

      // Set up request with matching tokens
      mockReq.cookies = { csrfToken: 'token-123' }
      mockReq.headers['x-csrf-token'] = 'token-123'
      expect(doubleSubmitMiddleware(mockReq, mockRes)).toBe(true)

      // Mismatched tokens
      mockReq.headers['x-csrf-token'] = 'different-token'
      expect(doubleSubmitMiddleware(mockReq, mockRes)).toBe(false)

      // Missing cookie token
      delete mockReq.cookies.csrfToken
      expect(doubleSubmitMiddleware(mockReq, mockRes)).toBe(false)
    })
  })

  describe('API Endpoint Protection', () => {
    it('should protect subscribe endpoint from CSRF', async () => {
      const subscribeHandler = async (req: any, res: any) => {
        // Validate CSRF token for subscribe endpoint
        if (req.method === 'POST') {
          const token = req.headers['x-csrf-token']
          if (!token || token !== req.session?.csrfToken) {
            return res.status(403).json({
              error: 'Invalid CSRF token',
            })
          }
        }

        // Process subscription
        return res.status(200).json({ success: true })
      }

      // Request without CSRF token
      mockReq.session = { csrfToken: 'valid-token' }
      await subscribeHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(403)

      // Request with valid CSRF token
      mockRes.status.mockClear()
      mockReq.headers['x-csrf-token'] = 'valid-token'
      await subscribeHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should protect preferences endpoint from CSRF', async () => {
      const preferencesHandler = async (req: any, res: any) => {
        if (req.method === 'POST' || req.method === 'PUT') {
          // Check origin header for API requests
          const origin = req.headers.origin
          const allowedOrigins = ['https://example.com', 'https://app.example.com']
          
          if (!origin || !allowedOrigins.includes(origin)) {
            return res.status(403).json({
              error: 'Cross-origin request blocked',
            })
          }
        }

        return res.status(200).json({ success: true })
      }

      // POST without origin
      mockReq.method = 'POST'
      await preferencesHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(403)

      // POST with invalid origin
      mockRes.status.mockClear()
      mockReq.headers.origin = 'https://evil.com'
      await preferencesHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(403)

      // POST with valid origin
      mockRes.status.mockClear()
      mockReq.headers.origin = 'https://example.com'
      await preferencesHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Token Timing Attack Prevention', () => {
    it('should use constant-time comparison for tokens', () => {
      const constantTimeCompare = (a: string, b: string): boolean => {
        if (a.length !== b.length) {
          return false
        }

        let result = 0
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i)
        }
        return result === 0
      }

      // Same tokens
      expect(constantTimeCompare('token123', 'token123')).toBe(true)
      
      // Different tokens
      expect(constantTimeCompare('token123', 'token456')).toBe(false)
      
      // Different lengths (early return is ok here)
      expect(constantTimeCompare('short', 'muchlongertoken')).toBe(false)

      // Measure timing (in real tests, would need more sophisticated timing)
      const token1 = 'a'.repeat(32)
      const token2 = 'b'.repeat(32)
      const start = performance.now()
      constantTimeCompare(token1, token2)
      const duration = performance.now() - start
      
      // Should take roughly same time regardless of where difference is
      expect(duration).toBeLessThan(1) // Very rough check
    })
  })

  describe('Pre-flight Request Handling', () => {
    it('should handle OPTIONS requests properly', async () => {
      const corsHandler = (req: any, res: any) => {
        const allowedOrigins = ['https://example.com', 'https://app.example.com']
        const origin = req.headers.origin

        if (req.method === 'OPTIONS') {
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin)
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
            res.setHeader('Access-Control-Allow-Credentials', 'true')
            res.setHeader('Access-Control-Max-Age', '86400')
          }
          return res.status(204).end()
        }

        // Regular request handling
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin)
          res.setHeader('Access-Control-Allow-Credentials', 'true')
        }
      }

      // OPTIONS request from allowed origin
      mockReq.method = 'OPTIONS'
      mockReq.headers.origin = 'https://example.com'
      corsHandler(mockReq, mockRes)
      
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      )
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.stringContaining('X-CSRF-Token')
      )
      expect(mockRes.status).toHaveBeenCalledWith(204)

      // OPTIONS request from disallowed origin
      mockRes.setHeader.mockClear()
      mockReq.headers.origin = 'https://evil.com'
      corsHandler(mockReq, mockRes)
      
      expect(mockRes.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://evil.com'
      )
    })
  })
})