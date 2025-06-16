import { describe, it, expect } from 'vitest'
import { 
  isValidEmail, 
  isDomainAllowed,
  validateSubscriberData, 
  sanitizeInput,
  extractUTMParams
} from '../../../utils/validation'

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
        'user123@example.co.uk',
        'first.last@company-name.com'
      ]

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user@@example.com',
        'user @example.com',
        'user@example',
        'user@.com',
        'user@example..com'
      ]

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })
  })

  describe('isDomainAllowed', () => {
    it('should allow all domains when no restrictions', () => {
      expect(isDomainAllowed('user@example.com', [])).toBe(true)
      expect(isDomainAllowed('user@example.com', undefined)).toBe(true)
    })

    it('should check domain against allowed list', () => {
      const allowedDomains = ['example.com', 'company.org']
      
      expect(isDomainAllowed('user@example.com', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@company.org', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@notallowed.com', allowedDomains)).toBe(false)
    })

    it('should be case insensitive', () => {
      const allowedDomains = ['Example.COM']
      
      expect(isDomainAllowed('user@example.com', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@EXAMPLE.COM', allowedDomains)).toBe(true)
    })

    it('should handle invalid email format', () => {
      const allowedDomains = ['example.com']
      
      expect(isDomainAllowed('notanemail', allowedDomains)).toBe(false)
      expect(isDomainAllowed('@example.com', allowedDomains)).toBe(false)
    })
  })

  describe('validateSubscriberData', () => {
    it('should validate complete subscriber data', () => {
      const result = validateSubscriberData({
        email: 'user@example.com',
        name: 'John Doe',
        source: 'website'
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should require email', () => {
      const result = validateSubscriberData({
        name: 'John Doe'
      } as any)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Email is required')
    })

    it('should validate email format', () => {
      const result = validateSubscriberData({
        email: 'invalid-email',
        name: 'John Doe'
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
    })

    it('should validate name length', () => {
      const result = validateSubscriberData({
        email: 'user@example.com',
        name: 'a'.repeat(101)
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Name is too long (max 100 characters)')
    })

    it('should validate source length', () => {
      const result = validateSubscriberData({
        email: 'user@example.com',
        source: 'a'.repeat(51)
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Source is too long (max 50 characters)')
    })

    it('should accumulate multiple errors', () => {
      const result = validateSubscriberData({
        email: 'invalid',
        name: 'a'.repeat(101),
        source: 'b'.repeat(51)
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<p>Hello</p>')).toBe('Hello')
      expect(sanitizeInput('<script>alert("xss")</script>Test')).toBe('Test')
      expect(sanitizeInput('Normal text')).toBe('Normal text')
    })

    it('should remove script tags and content', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<ScRiPt>alert("xss")</ScRiPt>',
        '<script src="evil.js"></script>',
        'Hello<script>bad()</script>World'
      ]

      expect(sanitizeInput(maliciousInputs[0])).toBe('')
      expect(sanitizeInput(maliciousInputs[1])).toBe('')
      expect(sanitizeInput(maliciousInputs[2])).toBe('')
      expect(sanitizeInput(maliciousInputs[3])).toBe('HelloWorld')
    })

    it('should handle event handlers', () => {
      const inputs = [
        '<img src=x onerror=alert("xss")>',
        '<div onclick="alert(\'xss\')">Click me</div>',
        '<a href="javascript:alert(\'xss\')">Link</a>'
      ]

      expect(sanitizeInput(inputs[0])).toBe('')
      expect(sanitizeInput(inputs[1])).toBe('Click me')
      expect(sanitizeInput(inputs[2])).toBe('Link')
    })

    it('should preserve safe characters', () => {
      const safeInputs = [
        'John Doe',
        'user@example.com',
        'Hello, World!',
        '123-456-7890',
        'Test & Co.',
        'Price: $99.99'
      ]

      safeInputs.forEach(input => {
        expect(sanitizeInput(input)).toBe(input)
      })
    })

    it('should handle unicode and emojis', () => {
      const inputs = [
        'Hello 👋 World',
        'Café résumé',
        '日本語 テスト',
        'Москва'
      ]

      inputs.forEach(input => {
        expect(sanitizeInput(input)).toBe(input)
      })
    })

    it('should handle null and empty strings', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('extractUTMParams', () => {
    it('should extract all UTM parameters', () => {
      const searchParams = new URLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer-sale',
        utm_content: 'banner',
        utm_term: 'newsletter',
        other_param: 'ignored'
      })

      const result = extractUTMParams(searchParams)

      expect(result).toEqual({
        source: 'google',
        medium: 'cpc',
        campaign: 'summer-sale',
        content: 'banner',
        term: 'newsletter'
      })
    })

    it('should handle partial UTM parameters', () => {
      const searchParams = new URLSearchParams({
        utm_source: 'facebook',
        utm_campaign: 'launch'
      })

      const result = extractUTMParams(searchParams)

      expect(result).toEqual({
        source: 'facebook',
        campaign: 'launch'
      })
    })

    it('should return empty object when no UTM parameters', () => {
      const searchParams = new URLSearchParams({
        page: '1',
        sort: 'date'
      })

      const result = extractUTMParams(searchParams)

      expect(result).toEqual({})
    })

    it('should handle empty search params', () => {
      const searchParams = new URLSearchParams()
      const result = extractUTMParams(searchParams)
      expect(result).toEqual({})
    })
  })

  describe('XSS Prevention', () => {
    it('should prevent various XSS attack vectors', () => {
      const xssVectors = [
        // Script injection
        '<script>alert(document.cookie)</script>',
        '<script src="https://evil.com/xss.js"></script>',
        
        // Event handlers
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<body onload=alert(1)>',
        
        // JavaScript protocol
        '<a href="javascript:alert(1)">Click</a>',
        '<iframe src="javascript:alert(1)">',
        
        // Style injection
        '<style>body{background:url("javascript:alert(1)")}</style>',
        '<div style="background:url(\'javascript:alert(1)\')">',
        
        // Case variations
        '<ScRiPt>alert(1)</ScRiPt>',
        '<IMG SRC=x OnErRoR=alert(1)>',
        
        // Comments
        '<!--<script>alert(1)</script>-->'
      ]

      xssVectors.forEach(vector => {
        const sanitized = sanitizeInput(vector)
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror')
        expect(sanitized).not.toContain('onload')
        expect(sanitized).not.toContain('onclick')
      })
    })
  })
})