import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { isValidEmail } from '../utils/validation'

export const createUnsubscribeEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/unsubscribe',
    method: 'post',
    handler: (async (req: any, res: any) => {
      try {
        const { email, token } = req.body

        // Two methods: email or token
        if (!email && !token) {
          return res.status(400).json({
            success: false,
            error: 'Email or token is required',
          })
        }

        let subscriber

        if (token) {
          // Token-based unsubscribe (from email link)
          try {
            const jwt = await import('jsonwebtoken')
            const payload = jwt.verify(
              token,
              process.env.JWT_SECRET || process.env.PAYLOAD_SECRET || ''
            ) as any

            if (payload.type !== 'unsubscribe') {
              throw new Error('Invalid token type')
            }

            // Token verified, so we can look up the subscriber
            // Using overrideAccess: true here is OK since we verified the token
            subscriber = await req.payload.findByID({
              collection: config.subscribersSlug || 'subscribers',
              id: payload.subscriberId,
            })
          } catch {
            return res.status(401).json({
              success: false,
              error: 'Invalid or expired unsubscribe link',
            })
          }
        } else {
          // Email-based unsubscribe
          if (!isValidEmail(email)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid email format',
            })
          }

          const result = await req.payload.find({
            collection: config.subscribersSlug || 'subscribers',
            where: {
              email: {
                equals: email.toLowerCase(),
              },
            },
          })

          if (result.docs.length === 0) {
            // Don't reveal if email exists or not
            return res.json({
              success: true,
              message: 'If this email was subscribed, it has been unsubscribed.',
            })
          }

          subscriber = result.docs[0]
        }

        if (!subscriber) {
          return res.json({
            success: true,
            message: 'If this email was subscribed, it has been unsubscribed.',
          })
        }

        // Check if already unsubscribed
        if (subscriber.subscriptionStatus === 'unsubscribed') {
          return res.json({
            success: true,
            message: 'Already unsubscribed',
          })
        }

        // Update subscription status - use synthetic user to ensure proper access
        await req.payload.update({
          collection: config.subscribersSlug || 'subscribers',
          id: subscriber.id,
          data: {
            subscriptionStatus: 'unsubscribed',
            unsubscribedAt: new Date().toISOString(),
          },
          overrideAccess: false,
          user: {
            collection: 'subscribers',
            id: subscriber.id,
            email: subscriber.email,
          },
        })

        res.json({
          success: true,
          message: 'Successfully unsubscribed',
        })
      } catch (error: unknown) {
        console.error('Unsubscribe error:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to unsubscribe. Please try again.',
        })
      }
    }) as PayloadHandler,
  }
}