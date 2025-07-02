import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, VerifyMagicLinkRequestData, ExtendedPayloadRequest } from '../types'
import { 
  verifyMagicLinkToken, 
  generateSessionToken 
} from '../utils/jwt'
import { renderEmail } from '../emails/render'

export const createVerifyMagicLinkEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/verify-magic-link',
    method: 'post',
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        const data = await req.json()
        const { token } = data as VerifyMagicLinkRequestData

        if (!token) {
          return Response.json({
            success: false,
            error: 'Token is required',
          }, { status: 400 })
        }

        // Verify the magic link token
        let payload
        try {
          payload = verifyMagicLinkToken(token)
        } catch (error: unknown) {
          return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Invalid token',
          }, { status: 401 })
        }

        // Find the subscriber - token verified so we can use admin access for initial lookup
        const subscriber = await req.payload.findByID({
          collection: config.subscribersSlug || 'subscribers',
          id: payload.subscriberId,
          // Keep overrideAccess: true for token verification
        })

        if (!subscriber) {
          return Response.json({
            success: false,
            error: 'Subscriber not found',
          }, { status: 404 })
        }

        // Check if email matches
        if (subscriber.email !== payload.email) {
          return Response.json({
            success: false,
            error: 'Invalid token',
          }, { status: 401 })
        }

        // Check if subscriber is active
        if (subscriber.subscriptionStatus === 'unsubscribed') {
          return Response.json({
            success: false,
            error: 'This email has been unsubscribed',
          }, { status: 403 })
        }

        // Create synthetic user for subscriber operations
        const syntheticUser = {
          collection: 'subscribers',
          id: subscriber.id,
          email: subscriber.email,
        }

        // Update subscription status if pending
        let isNewlyActivated = false
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
          isNewlyActivated = true
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

        // Send welcome email if newly activated
        if (isNewlyActivated) {
          try {
            // Get email service
            const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
            
            if (emailService) {
              // Get settings for site name
              const settings = await req.payload.findGlobal({
                slug: config.settingsSlug || 'newsletter-settings',
              })
              
              // Render welcome email
              const serverURL = req.payload.config.serverURL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
              const html = await renderEmail('welcome', {
                email: subscriber.email,
                siteName: settings?.brandSettings?.siteName || 'Newsletter',
                preferencesUrl: `${serverURL}/account/preferences`, // This could be customized
              })
              
              // Send email
              await emailService.send({
                to: subscriber.email,
                subject: settings?.brandSettings?.siteName ? `Welcome to ${settings.brandSettings.siteName}!` : 'Welcome!',
                html,
              })
              
              // Welcome email sent successfully
            } else {
              console.warn('Email service not initialized, cannot send welcome email')
            }
          } catch (error) {
            console.error('Failed to send welcome email:', error)
            // Don't fail the verification if welcome email fails
          }
        }

        // Set the session cookie
        const headers = new Headers()
        headers.append('Set-Cookie', `newsletter-auth=${sessionToken}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`)

        return Response.json({
          success: true,
          sessionToken,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            locale: subscriber.locale,
            emailPreferences: subscriber.emailPreferences,
          },
        }, { headers })
      } catch (error: unknown) {
        console.error('Verify magic link error:', error)
        return Response.json({
          success: false,
          error: 'Failed to verify magic link',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}