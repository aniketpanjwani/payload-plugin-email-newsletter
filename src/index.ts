import type { Config } from 'payload'
import type { NewsletterPluginConfig, BroadcastProvider } from './types'
import { createSubscribersCollection } from './collections/Subscribers'
import { createNewsletterSettingsGlobal } from './globals/NewsletterSettings'
import { createEmailService } from './providers'
import { createNewsletterEndpoints } from './endpoints'
import { createNewsletterSchedulingFields } from './fields/newsletterScheduling'
import { createUnsubscribeSyncJob } from './jobs/sync-unsubscribes'
import { createBroadcastsCollection } from './collections/Broadcasts'
import { BroadcastApiProvider } from './providers/broadcast/broadcast'
import { ResendBroadcastProvider } from './providers/resend/broadcast'

// Extend Payload type to include our email service and broadcast provider
declare module 'payload' {
  interface BasePayload {
    newsletterEmailService?: any
    broadcastProvider?: BroadcastProvider
    // Legacy support
    newsletterProvider?: BroadcastProvider
  }
}

export const newsletterPlugin = (pluginConfig: NewsletterPluginConfig) => (incomingConfig: Config): Config => {
  // Validate and set defaults
  const config: NewsletterPluginConfig = {
    enabled: true,
    subscribersSlug: 'subscribers',
    settingsSlug: 'newsletter-settings',
    auth: {
      enabled: true,
      tokenExpiration: '7d',
      magicLinkPath: '/newsletter/verify',
      ...pluginConfig.auth,
    },
    ...pluginConfig,
  }

  // If plugin is disabled, return config unchanged
  if (!config.enabled) {
    return incomingConfig
  }

  // Create plugin collections and globals
  const subscribersCollection = createSubscribersCollection(config)
  const settingsGlobal = createNewsletterSettingsGlobal(config)

  // Build collections array
  let collections = [...(incomingConfig.collections || []), subscribersCollection]

  // Add broadcast management collection if enabled
  if (config.features?.newsletterManagement?.enabled) {
    const broadcastsCollection = createBroadcastsCollection(config)
    collections.push(broadcastsCollection)
  }

  // Extend collections with newsletter scheduling fields if enabled
  if (config.features?.newsletterScheduling?.enabled) {
    const targetCollections = config.features.newsletterScheduling.collections || 'articles'
    const collectionsToExtend = Array.isArray(targetCollections) ? targetCollections : [targetCollections]
    const schedulingFields = createNewsletterSchedulingFields(config)
    
    collections = collections.map(collection => {
      if (collectionsToExtend.includes(collection.slug)) {
        return {
          ...collection,
          fields: [
            ...collection.fields,
            ...schedulingFields,
          ],
        }
      }
      return collection
    })
  }

  // Create API endpoints
  const endpoints = createNewsletterEndpoints(config)

  // Create sync job if enabled
  const syncJob = config.features?.unsubscribeSync?.enabled ? createUnsubscribeSyncJob(config) : null

  // Build the modified config
  const modifiedConfig: Config = {
    ...incomingConfig,
    collections,
    globals: [
      ...(incomingConfig.globals || []),
      settingsGlobal,
    ],
    endpoints: [
      ...(incomingConfig.endpoints || []),
      ...endpoints,
    ],
    jobs: syncJob ? {
      ...(incomingConfig.jobs || {}),
      tasks: [
        ...(incomingConfig.jobs?.tasks || []),
        syncJob,
      ],
      // Add cron schedule if specified
      autoRun: config.features?.unsubscribeSync?.schedule ? (
        Array.isArray(incomingConfig.jobs?.autoRun) 
          ? [...incomingConfig.jobs.autoRun, {
              cron: config.features.unsubscribeSync.schedule,
              queue: 'newsletter-sync',
              limit: 100,
            }]
          : typeof incomingConfig.jobs?.autoRun === 'function'
            ? async (payload: any) => {
                const autoRunFn = incomingConfig.jobs!.autoRun as (payload: any) => any[] | Promise<any[]>
                const existingConfigs = await autoRunFn(payload)
                return [...existingConfigs, {
                  cron: config.features!.unsubscribeSync!.schedule,
                  queue: 'newsletter-sync',
                  limit: 100,
                }]
              }
            : [{
                cron: config.features!.unsubscribeSync!.schedule,
                queue: 'newsletter-sync',
                limit: 100,
              }]
      ) : incomingConfig.jobs?.autoRun,
    } : incomingConfig.jobs,
    onInit: async (payload) => {
      // Initialize email service
      try {
        // Get settings from global
        const settings = await payload.findGlobal({
          slug: config.settingsSlug || 'newsletter-settings',
        })

        console.log('[Newsletter Plugin] Initializing with settings:', {
          hasSettings: !!settings,
          settingsProvider: settings?.provider,
          configProvider: config.providers?.default,
          hasBroadcastConfig: !!config.providers?.broadcast
        })

        let emailServiceConfig: any
        
        if (settings) {
          emailServiceConfig = {
            provider: settings.provider || config.providers.default,
            fromAddress: settings.fromAddress || config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: settings.fromName || config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            replyTo: settings.replyTo,
            resend: settings.provider === 'resend' ? {
              apiKey: settings.resendSettings?.apiKey || config.providers.resend?.apiKey || '',
              audienceIds: settings.resendSettings?.audienceIds?.reduce((acc: any, item: any) => {
                acc[item.locale] = {
                  production: item.production,
                  development: item.development,
                }
                return acc
              }, {}) || config.providers.resend?.audienceIds,
            } : config.providers.resend,
            broadcast: settings.provider === 'broadcast' ? {
              apiUrl: settings.broadcastSettings?.apiUrl || config.providers.broadcast?.apiUrl || '',
              token: settings.broadcastSettings?.token || config.providers.broadcast?.token || '',
              fromAddress: settings.fromAddress || config.providers.broadcast?.fromAddress,
              fromName: settings.fromName || config.providers.broadcast?.fromName,
              replyTo: settings.replyTo || config.providers.broadcast?.replyTo,
            } : config.providers.broadcast,
          }
        } else {
          // Use config defaults
          emailServiceConfig = {
            provider: config.providers.default,
            fromAddress: config.providers.resend?.fromAddress || config.providers.broadcast?.fromAddress || 'noreply@example.com',
            fromName: config.providers.resend?.fromName || config.providers.broadcast?.fromName || 'Newsletter',
            resend: config.providers.resend,
            broadcast: config.providers.broadcast,
          }
        }

        console.log('[Newsletter Plugin] Email service config:', {
          provider: emailServiceConfig.provider,
          hasBroadcastConfig: !!emailServiceConfig.broadcast,
          broadcastUrl: emailServiceConfig.broadcast?.apiUrl,
          hasToken: !!emailServiceConfig.broadcast?.token
        })

        try {
          const emailService = createEmailService(emailServiceConfig)
          ;(payload as any).newsletterEmailService = emailService

          console.log('[Newsletter Plugin] Email service initialized:', {
            provider: emailService.getProvider(),
            hasProvider: !!emailService,
            payloadHasService: !!(payload as any).newsletterEmailService
          })
        } catch (emailServiceError) {
          console.error('[Newsletter Plugin] Failed to create email service:', emailServiceError)
          console.error('[Newsletter Plugin] Email service config was:', emailServiceConfig)
          // Don't throw - let the plugin work without email service
        }
        
        // Initialize broadcast management provider if enabled
        if (config.features?.newsletterManagement?.enabled) {
          try {
            // Use custom provider if provided
            let broadcastProvider: BroadcastProvider
            
            if (config.features.newsletterManagement.provider) {
              broadcastProvider = config.features.newsletterManagement.provider
            } else {
              // Create provider based on email service config
              const providerType = emailServiceConfig.provider || config.providers.default
              
              if (providerType === 'broadcast' && emailServiceConfig.broadcast) {
                broadcastProvider = new BroadcastApiProvider(emailServiceConfig.broadcast)
              } else if (providerType === 'resend' && emailServiceConfig.resend) {
                broadcastProvider = new ResendBroadcastProvider(emailServiceConfig.resend)
              } else {
                throw new Error(`Unsupported broadcast provider: ${providerType}`)
              }
            }
            
            // Attach broadcast provider to payload instance
            const payloadWithProvider = payload as any
            payloadWithProvider.broadcastProvider = broadcastProvider
            // Legacy support
            payloadWithProvider.newsletterProvider = broadcastProvider
            
            console.warn('Broadcast management initialized with', broadcastProvider.name, 'provider')
          } catch (error) {
            console.error('Failed to initialize broadcast management provider:', error)
          }
        }
      } catch (error) {
        console.error('Failed to initialize newsletter email service:', error)
      }

      // Call original onInit if it exists
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }
    },
  }

  return modifiedConfig
}

export { newsletterPlugin as default }

// Export session utilities
export * from './utilities/session'

// Export contexts for advanced users
export * from './contexts/PluginConfigContext'