import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { verifySessionToken } from '../utils/jwt'

export const createPreferencesEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/preferences',
    method: 'get',
    handler: (async (req: any, res: any) => {
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
          })
        }

        const token = authHeader.substring(7)

        // Verify session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch (error: unknown) {
          return res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          })
        }

        // Get subscriber - use synthetic user to ensure access control
        const subscriber = await req.payload.findByID({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          overrideAccess: false,
          user: {
            collection: 'subscribers',
            id: payload.subscriberId,
            email: payload.email,
          },
        })

        if (!subscriber) {
          return res.status(404).json({
            success: false,
            error: 'Subscriber not found',
          })
        }

        res.json({
          success: true,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            locale: subscriber.locale,
            emailPreferences: subscriber.emailPreferences,
            subscriptionStatus: subscriber.subscriptionStatus,
          },
        })
      } catch (error: unknown) {
        console.error('Get preferences error:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to get preferences',
        })
      }
    }) as PayloadHandler,
  }
}

export const createUpdatePreferencesEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/preferences',
    method: 'post',
    handler: (async (req: any, res: any) => {
      try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Authorization required',
          })
        }

        const token = authHeader.substring(7)

        // Verify session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch (error: unknown) {
          return res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          })
        }

        const { name, locale, emailPreferences } = req.body

        // Prepare update data
        const updateData: any = {}
        
        if (name !== undefined) {
          updateData.name = name
        }
        
        if (locale !== undefined) {
          updateData.locale = locale
        }
        
        if (emailPreferences !== undefined) {
          updateData.emailPreferences = emailPreferences
        }

        // Update subscriber - use synthetic user to ensure only updating own data
        const subscriber = await req.payload.update({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          data: updateData,
          overrideAccess: false,
          user: {
            collection: 'subscribers',
            id: payload.subscriberId,
            email: payload.email,
          },
        })

        res.json({
          success: true,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            locale: subscriber.locale,
            emailPreferences: subscriber.emailPreferences,
            subscriptionStatus: subscriber.subscriptionStatus,
          },
        })
      } catch (error: unknown) {
        console.error('Update preferences error:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to update preferences',
        })
      }
    }) as PayloadHandler,
  }
}