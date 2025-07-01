import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, Subscriber, UpdatePreferencesRequestData, ExtendedPayloadRequest } from '../types'
import { verifySessionToken } from '../utils/jwt'

export const createPreferencesEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/preferences',
    method: 'get',
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Response.json({
            success: false,
            error: 'Authorization required',
          }, { status: 401 })
        }

        const token = authHeader.substring(7)

        // Verify session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch (error: unknown) {
          return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          }, { status: 401 })
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
          return Response.json({
            success: false,
            error: 'Subscriber not found',
          }, { status: 404 })
        }

        return Response.json({
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
        return Response.json({
          success: false,
          error: 'Failed to get preferences',
        }, { status: 500 })
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
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Response.json({
            success: false,
            error: 'Authorization required',
          }, { status: 401 })
        }

        const token = authHeader.substring(7)

        // Verify session token
        let payload
        try {
          payload = verifySessionToken(token)
        } catch (error: unknown) {
          return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          }, { status: 401 })
        }

        const { name, locale, emailPreferences } = req.data as UpdatePreferencesRequestData

        // Prepare update data
        const updateData: Partial<Subscriber> = {}
        
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

        return Response.json({
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
        return Response.json({
          success: false,
          error: 'Failed to update preferences',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}