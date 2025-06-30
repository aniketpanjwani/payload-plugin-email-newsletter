import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { verifySessionToken } from '../utils/jwt'

export const createMeEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/me',
    method: 'get',
    handler: (async (req: any, res: any) => {
      try {
        // Get token from cookie
        const token = req.cookies?.['newsletter-auth']
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
          })
        }

        // Verify the session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired session',
          })
        }

        // Get fresh subscriber data
        const subscriber = await req.payload.findByID({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          overrideAccess: true, // Need to get subscriber data
        })

        if (!subscriber || subscriber.subscriptionStatus !== 'active') {
          return res.status(401).json({
            success: false,
            error: 'Not authenticated',
          })
        }

        res.json({
          success: true,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            status: subscriber.subscriptionStatus,
            preferences: {
              frequency: subscriber.emailPreferences?.frequency,
              categories: subscriber.emailPreferences?.categories,
            },
            createdAt: subscriber.createdAt,
            updatedAt: subscriber.updatedAt,
          },
        })
      } catch (error) {
        console.error('Me endpoint error:', error)
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        })
      }
    }) as PayloadHandler,
  }
}