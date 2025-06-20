import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { 
  isDomainAllowed, 
  sanitizeInput, 
  validateSubscriberData,
  extractUTMParams 
} from '../utils/validation'

export const createSubscribeEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/subscribe',
    method: 'post',
    handler: (async (req: any, res: any) => {
      try {
        const { 
          email, 
          name, 
          source,
          preferences,
          leadMagnet,
          surveyResponses,
          metadata = {}
        } = req.body

        // Trim email before validation
        const trimmedEmail = email?.trim()

        // Validate input
        const validation = validateSubscriberData({ email: trimmedEmail, name, source })
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            errors: validation.errors,
          })
        }

        // Check domain restrictions from global settings
        // Settings are public info needed for validation, but we can still respect access control
        const settings = await req.payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
          overrideAccess: false,
          // No user context for public endpoint
        })

        const allowedDomains = settings?.subscriptionSettings?.allowedDomains?.map((d: any) => d.domain) || []
        if (!isDomainAllowed(trimmedEmail, allowedDomains)) {
          return res.status(400).json({
            success: false,
            error: 'Email domain not allowed',
          })
        }

        // Check if already subscribed
        // This needs admin access to check for existing email
        const existing = await req.payload.find({
          collection: config.subscribersSlug || 'subscribers',
          where: {
            email: {
              equals: trimmedEmail.toLowerCase(),
            },
          },
          overrideAccess: true, // Need to check for duplicates in public endpoint
        })

        if (existing.docs.length > 0) {
          const subscriber = existing.docs[0]
          
          // If unsubscribed, don't allow resubscription via API
          if (subscriber.subscriptionStatus === 'unsubscribed') {
            return res.status(400).json({
              success: false,
              error: 'This email has been unsubscribed. Please contact support to resubscribe.',
            })
          }

          return res.status(400).json({
            success: false,
            error: 'Already subscribed',
            subscriber: {
              id: subscriber.id,
              email: subscriber.email,
              subscriptionStatus: subscriber.subscriptionStatus,
            },
          })
        }

        // Check IP rate limiting
        const ipAddress = req.ip || req.connection.remoteAddress
        const maxPerIP = settings?.subscriptionSettings?.maxSubscribersPerIP || 10

        const ipSubscribers = await req.payload.find({
          collection: config.subscribersSlug || 'subscribers',
          where: {
            'signupMetadata.ipAddress': {
              equals: ipAddress,
            },
          },
          overrideAccess: true, // Need to check IP limits in public endpoint
        })

        if (ipSubscribers.docs.length >= maxPerIP) {
          return res.status(429).json({
            success: false,
            error: 'Too many subscriptions from this IP address',
          })
        }

        // Extract UTM parameters
        const referer = req.headers.referer || req.headers.referrer || ''
        let utmParams = {}
        if (referer) {
          try {
            utmParams = extractUTMParams(new URL(referer).searchParams)
          } catch {
            // Invalid URL, ignore UTM params
          }
        }

        // Prepare subscriber data
        const subscriberData: any = {
          email: trimmedEmail.toLowerCase(),
          name: name ? sanitizeInput(name) : undefined,
          locale: metadata.locale || config.i18n?.defaultLocale || 'en',
          subscriptionStatus: settings?.subscriptionSettings?.requireDoubleOptIn ? 'pending' : 'active',
          source: source || 'api',
          emailPreferences: {
            newsletter: true,
            announcements: true,
            ...(preferences || {}),
          },
          signupMetadata: {
            ipAddress,
            userAgent: req.headers['user-agent'],
            referrer: referer,
            signupPage: metadata.signupPage || referer,
          },
        }

        // Add UTM parameters if tracking is enabled
        if (config.features?.utmTracking?.enabled && Object.keys(utmParams).length > 0) {
          subscriberData.utmParameters = utmParams
        }

        // Add lead magnet if provided
        if (config.features?.leadMagnets?.enabled && leadMagnet) {
          subscriberData.leadMagnet = leadMagnet
        }

        // Create subscriber
        // Public endpoint needs to create subscribers
        const subscriber = await req.payload.create({
          collection: config.subscribersSlug || 'subscribers',
          data: subscriberData,
          overrideAccess: true, // Public endpoint needs to create subscribers
        })

        // Handle survey responses if provided
        if (config.features?.surveys?.enabled && surveyResponses) {
          // TODO: Store survey responses
        }

        // Send confirmation email if double opt-in
        if (settings?.subscriptionSettings?.requireDoubleOptIn) {
          // TODO: Send confirmation email with magic link
        }

        res.json({
          success: true,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            subscriptionStatus: subscriber.subscriptionStatus,
          },
          message: settings?.subscriptionSettings?.requireDoubleOptIn 
            ? 'Please check your email to confirm your subscription'
            : 'Successfully subscribed',
        })
      } catch {
        res.status(500).json({
          success: false,
          error: 'Failed to subscribe. Please try again.',
        })
      }
    }) as PayloadHandler,
  }
}