import type { Access, AccessArgs } from 'payload'
import type { NewsletterPluginConfig } from '../types'

/**
 * Check if a user is an admin based on the plugin configuration
 */
export const isAdmin = (user: any, config?: NewsletterPluginConfig): boolean => {
  if (!user || user.collection !== 'users') {
    return false
  }

  // If custom admin check is provided, use it
  if (config?.access?.isAdmin) {
    return config.access.isAdmin(user)
  }

  // Default checks for common admin patterns
  // 1. Check for admin role
  if (user.roles?.includes('admin')) {
    return true
  }

  // 2. Check for isAdmin boolean field
  if (user.isAdmin === true) {
    return true
  }

  // 3. Check for role field with admin value
  if (user.role === 'admin') {
    return true
  }

  // 4. Check for admin collection relationship
  if (user.admin === true) {
    return true
  }

  return false
}

/**
 * Create admin-only access control
 */
export const adminOnly = (config?: NewsletterPluginConfig): Access => 
  ({ req }: AccessArgs) => {
    const user = req.user
    return isAdmin(user, config)
  }

/**
 * Create admin or owner access control
 */
export const adminOrSelf = (config?: NewsletterPluginConfig): Access => 
  ({ req, id }: AccessArgs) => {
    const user = req.user
    
    // No user = no access
    if (!user) {
      // For list operations without ID, return impossible condition
      if (!id) {
        return {
          id: {
            equals: 'unauthorized-no-access',
          },
        }
      }
      return false
    }
    
    // Admins can access everything
    if (isAdmin(user, config)) {
      return true
    }
    
    // Synthetic users (subscribers from magic link) can access their own data
    if (user.collection === 'subscribers') {
      // For list operations, scope to their own data
      if (!id) {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      // For specific document access, check if it's their own
      return id === user.id
    }
    
    // Regular users cannot access subscriber data
    if (!id) {
      return {
        id: {
          equals: 'unauthorized-no-access',
        },
      }
    }
    return false
  }