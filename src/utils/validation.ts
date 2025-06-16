import DOMPurify from 'isomorphic-dompurify'

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  // Trim whitespace
  const trimmed = email.trim()
  
  // Length limits
  if (trimmed.length > 255) return false
  
  // Check for dangerous patterns
  if (trimmed.includes('<') || trimmed.includes('>')) return false
  if (trimmed.includes('javascript:')) return false
  if (trimmed.includes('data:')) return false
  
  // Basic format validation with stricter regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(trimmed)) return false
  
  // Additional validation rules
  const parts = trimmed.split('@')
  if (parts.length !== 2) return false
  
  const [localPart, domain] = parts
  
  // Check local part length
  if (localPart.length > 64 || localPart.length === 0) return false
  
  // Check for invalid patterns
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false
  if (localPart.includes('..')) return false
  
  return true
}

/**
 * Normalize email for rate limiting and deduplication
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  
  const parts = email.toLowerCase().trim().split('@')
  if (parts.length !== 2) return email.toLowerCase().trim()
  
  let [localPart, domain] = parts
  
  // Remove dots from local part (Gmail-style)
  localPart = localPart.replace(/\./g, '')
  
  // Remove everything after + (Gmail-style aliases)
  const plusIndex = localPart.indexOf('+')
  if (plusIndex > -1) {
    localPart = localPart.substring(0, plusIndex)
  }
  
  return `${localPart}@${domain}`
}

/**
 * Check if email domain is allowed
 */
export function isDomainAllowed(
  email: string,
  allowedDomains?: string[]
): boolean {
  // Validate email format first
  if (!isValidEmail(email)) {
    return false
  }
  
  // If no domains specified, allow all valid emails
  if (!allowedDomains || allowedDomains.length === 0) {
    return true
  }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false

  return allowedDomains.some(
    allowedDomain => domain === allowedDomain.toLowerCase()
  )
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // First, remove all HTML tags and scripts
  let cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
  
  // Additional security: remove dangerous patterns
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:\/\//gi, '')
    .replace(/onload/gi, '')
    .replace(/onerror/gi, '')
    .replace(/onclick/gi, '')
    .replace(/onmouseover/gi, '')
    .replace(/alert\(/gi, '')
    .replace(/prompt\(/gi, '')
    .replace(/confirm\(/gi, '')
    .replace(/\|/g, '') // Remove pipe character (command injection)
    .replace(/;/g, '') // Remove semicolon (command chaining)
    .replace(/`/g, '') // Remove backticks (command substitution)
    .replace(/&&/g, '') // Remove command chaining
    .replace(/\$\(/g, '') // Remove command substitution pattern $()
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/\/\.\./g, '') // Remove path traversal
    .replace(/\0/g, '') // Remove null bytes
  
  return cleaned.trim()
}

/**
 * Extract UTM parameters from URL search params
 */
export function extractUTMParams(searchParams: URLSearchParams): Record<string, string> {
  const utmParams: Record<string, string> = {}
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

  utmKeys.forEach(key => {
    const value = searchParams.get(key)
    if (value) {
      // Remove 'utm_' prefix for storage
      const shortKey = key.replace('utm_', '')
      utmParams[shortKey] = value
    }
  })

  return utmParams
}

/**
 * Validate source field - only allow predefined values
 */
export function isValidSource(source: string): boolean {
  if (!source || typeof source !== 'string') return false
  
  const allowedSources = [
    'website',
    'api',
    'import',
    'admin',
    'signup-form',
    'magic-link',
    'preferences',
    'external'
  ]
  
  return allowedSources.includes(source)
}

/**
 * Validate subscriber data before creation
 */
export interface ValidateSubscriberResult {
  valid: boolean
  errors: string[]
}

export function validateSubscriberData(data: any): ValidateSubscriberResult {
  const errors: string[] = []

  // Email validation
  if (!data.email) {
    errors.push('Email is required')
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format')
  }

  // Name validation (optional but if provided, should be reasonable)
  if (data.name && data.name.length > 100) {
    errors.push('Name is too long (max 100 characters)')
  }

  // Source validation
  if (data.source !== undefined) {
    if (!data.source || data.source.length === 0) {
      errors.push('Source cannot be empty')
    } else if (data.source.length > 50) {
      errors.push('Source is too long (max 50 characters)')
    } else if (!isValidSource(data.source)) {
      errors.push('Invalid source value')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}