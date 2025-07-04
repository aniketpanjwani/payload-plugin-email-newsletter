import type { PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { isAdmin } from './access'

/**
 * Get authenticated user from request
 * In Payload v3, authentication is handled differently than v2
 */
export async function getAuthenticatedUser(req: PayloadRequest): Promise<any | null> {
  try {
    // Try to get the current user using Payload's auth
    // This requires the request to have proper authentication headers/cookies
    const me = await req.payload.find({
      collection: 'users',
      where: {
        id: {
          equals: 'me', // Special value in Payload to get current user
        },
      },
      limit: 1,
      depth: 0,
    })
    
    return me.docs[0] || null
  } catch {
    return null
  }
}

/**
 * Check if request has admin access
 */
export async function requireAdmin(
  req: PayloadRequest,
  config: NewsletterPluginConfig
): Promise<{ authorized: true; user: any } | { authorized: false; error: string }> {
  const user = await getAuthenticatedUser(req)
  
  if (!user) {
    return {
      authorized: false,
      error: 'Authentication required',
    }
  }
  
  if (!isAdmin(user, config)) {
    return {
      authorized: false,
      error: 'Admin access required',
    }
  }
  
  return {
    authorized: true,
    user,
  }
}