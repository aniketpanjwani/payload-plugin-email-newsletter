import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { 
  verifyMagicLinkToken, 
  generateSessionToken 
} from '../utils/jwt'

export const createVerifyMagicLinkEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/verify-magic-link',
    method: 'post',
    handler: (async (req: any, res: any) => {
      try {
        const { token } = req.body

        if (!token) {
          return res.status(400).json({
            success: false,
            error: 'Token is required',
          })
        }

        // Verify the magic link token
        let payload
        try {
          payload = verifyMagicLinkToken(token)
        } catch (error: unknown) {
          return res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          })
        }

        // Find the subscriber - token verified so we can use admin access for initial lookup
        const subscriber = await req.payload.findByID({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          // Keep overrideAccess: true for token verification
        })

        if (!subscriber) {
          return res.status(404).json({
            success: false,
            error: 'Subscriber not found',
          })
        }

        // Check if email matches
        if (subscriber.email !== payload.email) {
          return res.status(401).json({
            success: false,
            error: 'Invalid token',
          })
        }

        // Check if subscriber is active
        if (subscriber.subscriptionStatus === 'unsubscribed') {
          return res.status(403).json({
            success: false,
            error: 'This email has been unsubscribed',
          })
        }

        // Create synthetic user for subscriber operations
        const syntheticUser = {
          collection: 'subscribers',
          id: subscriber.id,
          email: subscriber.email,
        }

        // Update subscription status if pending
        if (subscriber.subscriptionStatus === 'pending') {
          await req.payload.update({
            collection: config.subscribersSlug || 'subscribers',
            id: subscriber.id,
            data: {
              subscriptionStatus: 'active',
            },
            overrideAccess: false,
            user: syntheticUser,
          })
        }

        // Clear the magic link token
        await req.payload.update({
          collection: config.subscribersSlug || 'subscribers',
          id: subscriber.id,
          data: {
            magicLinkToken: null,
            magicLinkTokenExpiry: null,
          },
          overrideAccess: false,
          user: syntheticUser,
        })

        // Generate session token
        const sessionToken = generateSessionToken(
          String(subscriber.id),
          subscriber.email
        )

        res.json({
          success: true,
          sessionToken,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            locale: subscriber.locale,
            emailPreferences: subscriber.emailPreferences,
          },
        })
      } catch (error: unknown) {
        console.error('Verify magic link error:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to verify magic link',
        })
      }
    }) as PayloadHandler,
  }
}