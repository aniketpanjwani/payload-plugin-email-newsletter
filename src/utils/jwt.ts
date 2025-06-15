import jwt from 'jsonwebtoken'
import type { NewsletterPluginConfig } from '../types'

export interface MagicLinkTokenPayload {
  subscriberId: string
  email: string
  type: 'magic-link'
}

export interface SessionTokenPayload {
  subscriberId: string
  email: string
  type: 'session'
}

/**
 * Get JWT secret from environment or generate a warning
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.PAYLOAD_SECRET

  if (!secret) {
    console.warn(
      'WARNING: No JWT_SECRET or PAYLOAD_SECRET found in environment variables. ' +
      'Magic link authentication will not work properly. ' +
      'Please set JWT_SECRET in your environment.'
    )
    // Return a placeholder to prevent crashes during development
    return 'INSECURE_DEVELOPMENT_SECRET_PLEASE_SET_JWT_SECRET'
  }

  return secret
}

/**
 * Generate a magic link token for email authentication
 */
export function generateMagicLinkToken(
  subscriberId: string,
  email: string,
  config: NewsletterPluginConfig
): string {
  const payload: MagicLinkTokenPayload = {
    subscriberId,
    email,
    type: 'magic-link',
  }

  const expiresIn = config.auth?.tokenExpiration || '7d'

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn,
    issuer: 'payload-newsletter-plugin',
  })
}

/**
 * Verify a magic link token
 */
export function verifyMagicLinkToken(token: string): MagicLinkTokenPayload {
  try {
    const payload = jwt.verify(token, getJWTSecret(), {
      issuer: 'payload-newsletter-plugin',
    }) as any

    if (payload.type !== 'magic-link') {
      throw new Error('Invalid token type')
    }

    return payload as MagicLinkTokenPayload
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Magic link has expired. Please request a new one.')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid magic link token')
    }
    throw error
  }
}

/**
 * Generate a session token after successful magic link verification
 */
export function generateSessionToken(
  subscriberId: string,
  email: string
): string {
  const payload: SessionTokenPayload = {
    subscriberId,
    email,
    type: 'session',
  }

  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: '30d',
    issuer: 'payload-newsletter-plugin',
  })
}

/**
 * Verify a session token
 */
export function verifySessionToken(token: string): SessionTokenPayload {
  try {
    const payload = jwt.verify(token, getJWTSecret(), {
      issuer: 'payload-newsletter-plugin',
    }) as any

    if (payload.type !== 'session') {
      throw new Error('Invalid token type')
    }

    return payload as SessionTokenPayload
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Session has expired. Please sign in again.')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid session token')
    }
    throw error
  }
}

/**
 * Generate a magic link URL
 */
export function generateMagicLinkURL(
  token: string,
  baseURL: string,
  config: NewsletterPluginConfig
): string {
  const path = config.auth?.magicLinkPath || '/newsletter/verify'
  const url = new URL(path, baseURL)
  url.searchParams.set('token', token)
  return url.toString()
}