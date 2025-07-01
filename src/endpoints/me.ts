import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, ExtendedPayloadRequest } from '../types'
import { verifySessionToken } from '../utils/jwt'

export const createMeEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/me',
    method: 'get',
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        // Get token from cookie
        const token = req.cookies?.['newsletter-auth']
        
        if (!token) {
          return Response.json({
            success: false,
            error: 'Not authenticated',
          }, { status: 401 })
        }

        // Verify the session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch {
          return Response.json({
            success: false,
            error: 'Invalid or expired session',
          }, { status: 401 })
        }

        // Get fresh subscriber data
        const subscriber = await req.payload.findByID({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          overrideAccess: true, // Need to get subscriber data
        })

        if (!subscriber || subscriber.subscriptionStatus !== 'active') {
          return Response.json({
            success: false,
            error: 'Not authenticated',
          }, { status: 401 })
        }

        return Response.json({
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
        return Response.json({
          success: false,
          error: 'Internal server error',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}