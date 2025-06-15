/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if email domain is allowed
 */
export function isDomainAllowed(
  email: string,
  allowedDomains?: string[]
): boolean {
  // If no domains specified, allow all
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
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
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
  if (data.source && data.source.length > 50) {
    errors.push('Source is too long (max 50 characters)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}