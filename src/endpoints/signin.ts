import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, SigninRequestData, ExtendedPayloadRequest } from '../types'
import { validateSubscriberData } from '../utils/validation'
import { generateMagicLinkToken, generateMagicLinkURL } from '../utils/jwt'
import { renderEmail } from '../emails/render'
import { RateLimiter } from '../utils/rate-limiter'

// Create rate limiter: 5 attempts per 15 minutes
const signinRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  prefix: 'signin',
})

export const createSigninEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/signin',
    method: 'post',
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        const data = await req.json()
        const { email, redirectUrl } = data as SigninRequestData & { redirectUrl?: string }

        // Validate email
        const validation = validateSubscriberData({ email })
        if (!validation.valid) {
          return Response.json({
            success: false,
            errors: validation.errors,
          }, { status: 400 })
        }

        // Check rate limit (per email to prevent abuse)
        const rateLimitKey = `signin:${email.toLowerCase()}`
        const allowed = await signinRateLimiter.checkLimit(rateLimitKey)
        
        if (!allowed) {
          return Response.json({
            success: false,
            error: 'Too many sign-in attempts. Please try again later.',
          }, { status: 429 })
        }

        // Find existing subscriber (including unsubscribed)
        const result = await req.payload.find({
          collection: config.subscribersSlug || 'subscribers',
          where: {
            email: { equals: email.toLowerCase() },
          },
          limit: 1,
          overrideAccess: true, // Need to check subscriber exists
        })

        if (result.docs.length === 0) {
          return Response.json({
            success: false,
            error: 'Email not found. Please subscribe first.',
            requiresSubscribe: true,
          }, { status: 404 })
        }

        const subscriber = result.docs[0]
        
        // Check if unsubscribed and whether we allow unsubscribed signin
        const allowUnsubscribed = config.auth?.allowUnsubscribedSignin ?? false
        
        if (subscriber.subscriptionStatus === 'unsubscribed' && !allowUnsubscribed) {
          return Response.json({
            success: false,
            error: 'Your subscription is inactive. Please resubscribe to sign in.',
            subscriber: {
              id: subscriber.id,
              email: subscriber.email,
              subscriptionStatus: subscriber.subscriptionStatus,
            },
            requiresResubscribe: true,
          }, { status: 403 })
        }

        // Generate magic link token
        const token = generateMagicLinkToken(
          String(subscriber.id),
          subscriber.email,
          config
        )

        // Generate magic link URL
        const serverURL = req.payload.config.serverURL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
        const magicLinkURL = generateMagicLinkURL(token, serverURL, config, redirectUrl)

        // Get email service
        const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service

        if (emailService) {
          // Get settings for customization
          const settings = await req.payload.findGlobal({
            slug: config.settingsSlug || 'newsletter-settings',
          })

          // Render email
          const html = await renderEmail('signin', {
            magicLink: magicLinkURL,
            email: subscriber.email,
            siteName: settings?.brandSettings?.siteName || 'Newsletter',
            expiresIn: config.auth?.tokenExpiration || '7d',
          })

          // Send email
          await emailService.send({
            to: subscriber.email,
            subject: settings?.brandSettings?.siteName 
              ? `Sign in to ${settings.brandSettings.siteName}` 
              : 'Sign in to your account',
            html,
          })

          // Sign-in email sent successfully
        } else {
          console.warn('Email service not initialized, cannot send sign-in link')
        }

        return Response.json({
          success: true,
          message: 'Check your email for the sign-in link',
        })
      } catch (error) {
        console.error('Sign-in error:', error)
        return Response.json({
          success: false,
          error: 'Failed to process sign-in request',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}