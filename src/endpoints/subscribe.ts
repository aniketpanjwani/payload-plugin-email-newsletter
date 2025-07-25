import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, Subscriber, SubscribeRequestData, ExtendedPayloadRequest } from '../types'
import { 
  isDomainAllowed, 
  sanitizeInput, 
  validateSubscriberData,
  extractUTMParams 
} from '../utils/validation'
import { generateMagicLinkToken, generateMagicLinkURL } from '../utils/jwt'
import { renderEmail } from '../emails/render'

export const createSubscribeEndpoint = (
  config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/subscribe',
    method: 'post',
    handler: (async (req: ExtendedPayloadRequest) => {
      try {
        const data = await req.json()
        const { 
          email, 
          name, 
          source,
          preferences,
          leadMagnet,
          surveyResponses,
          metadata = {}
        } = data as SubscribeRequestData

        // Trim email before validation
        const trimmedEmail = email?.trim()

        // Validate input
        const validation = validateSubscriberData({ email: trimmedEmail, name, source })
        if (!validation.valid) {
          return Response.json({
            success: false,
            errors: validation.errors,
          }, { status: 400 })
        }

        // Check domain restrictions from global settings
        // Settings are public info needed for validation, but we can still respect access control
        const settings = await req.payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
          overrideAccess: false,
          // No user context for public endpoint
        })

        const allowedDomains = settings?.subscriptionSettings?.allowedDomains?.map((d: { domain: string }) => d.domain) || []
        if (!isDomainAllowed(trimmedEmail, allowedDomains)) {
          return Response.json({
            success: false,
            error: 'Email domain not allowed',
          }, { status: 400 })
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
          
          // Handle unsubscribed users
          if (subscriber.subscriptionStatus === 'unsubscribed') {
            const allowResubscribe = config.auth?.allowResubscribe ?? false
            
            if (!allowResubscribe) {
              return Response.json({
                success: false,
                error: 'This email has been unsubscribed. Please contact support to resubscribe.',
              }, { status: 400 })
            }
            
            // Resubscribe the user
            const updated = await req.payload.update({
              collection: config.subscribersSlug || 'subscribers',
              id: subscriber.id,
              data: {
                subscriptionStatus: 'active',
                resubscribedAt: new Date().toISOString(),
                // Preserve preferences but update metadata
                signupMetadata: {
                  ...metadata,
                  source: source || 'resubscribe',
                  resubscribedFrom: subscriber.signupMetadata?.source,
                },
              },
              overrideAccess: true,
            })
            
            // Fire afterSubscribe hook for resubscription
            if (config.hooks?.afterSubscribe) {
              await config.hooks.afterSubscribe({
                doc: updated,
                req,
              })
            }
            
            // Send welcome back email
            const emailService = (req.payload as any).newsletterEmailService
            if (emailService) {
              const settings = await req.payload.findGlobal({
                slug: config.settingsSlug || 'newsletter-settings',
              })
              
              const html = await renderEmail('welcome', {
                name: updated.name || '',
                email: updated.email,
                siteName: settings?.brandSettings?.siteName || 'Newsletter',
                siteUrl: req.payload.config.serverURL || '',
              }, config)
              
              await emailService.send({
                to: updated.email,
                subject: `Welcome back to ${settings?.brandSettings?.siteName || 'our newsletter'}!`,
                html,
              })
            }
            
            return Response.json({
              success: true,
              message: 'Welcome back! You have been resubscribed.',
              subscriber: {
                id: updated.id,
                email: updated.email,
                subscriptionStatus: updated.subscriptionStatus,
              },
              wasResubscribed: true,
            })
          }
          
          // Already active subscriber - send sign-in link instead
          if (subscriber.subscriptionStatus === 'active') {
            // Generate magic link for signin
            const token = generateMagicLinkToken(
              String(subscriber.id),
              subscriber.email,
              config
            )
            
            const serverURL = req.payload.config.serverURL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
            const magicLinkURL = generateMagicLinkURL(token, serverURL, config)
            
            // Send signin email
            const emailService = (req.payload as any).newsletterEmailService
            if (emailService) {
              const settings = await req.payload.findGlobal({
                slug: config.settingsSlug || 'newsletter-settings',
              })
              
              const html = await renderEmail('signin', {
                magicLink: magicLinkURL,
                email: subscriber.email,
                siteName: settings?.brandSettings?.siteName || 'Newsletter',
                expiresIn: config.auth?.tokenExpiration || '7d',
              }, config)
              
              await emailService.send({
                to: subscriber.email,
                subject: `Sign in to ${settings?.brandSettings?.siteName || 'your account'}`,
                html,
              })
            }
            
            return Response.json({
              success: true,
              message: 'You are already subscribed! Check your email for a sign-in link.',
              alreadySubscribed: true,
            })
          }
        }

        // Check IP rate limiting
        const ipAddress = req.ip || req.connection?.remoteAddress
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
          return Response.json({
            success: false,
            error: 'Too many subscriptions from this IP address',
          }, { status: 429 })
        }

        // Extract UTM parameters
        const referer = req.headers.get('referer') || req.headers.get('referrer') || ''
        let utmParams = {}
        if (referer) {
          try {
            utmParams = extractUTMParams(new URL(referer).searchParams)
          } catch {
            // Invalid URL, ignore UTM params
          }
        }

        // Prepare subscriber data
        const subscriberData: Partial<Subscriber> = {
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
            userAgent: req.headers.get('user-agent') || undefined,
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
          try {
            // Generate magic link token
            const token = generateMagicLinkToken(
              String(subscriber.id),
              subscriber.email,
              config
            )
            
            // Generate magic link URL
            const serverURL = req.payload.config.serverURL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
            const magicLinkURL = generateMagicLinkURL(token, serverURL, config)
            
            // Get email service
            const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
            
            if (emailService) {
              // Render email
              const html = await renderEmail('magic-link', {
                magicLink: magicLinkURL,
                email: subscriber.email,
                siteName: settings?.brandSettings?.siteName || 'Newsletter',
                expiresIn: config.auth?.tokenExpiration || '7d',
              }, config)
              
              // Send email
              await emailService.send({
                to: subscriber.email,
                subject: settings?.brandSettings?.siteName ? `Verify your email for ${settings.brandSettings.siteName}` : 'Verify your email',
                html,
              })
              
              // Magic link email sent successfully
            } else {
              console.warn('Email service not initialized, cannot send magic link')
            }
          } catch (error) {
            console.error('Failed to send magic link email:', error)
            // Don't fail the subscription if email fails
          }
        }

        return Response.json({
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
        return Response.json({
          success: false,
          error: 'Failed to subscribe. Please try again.',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}