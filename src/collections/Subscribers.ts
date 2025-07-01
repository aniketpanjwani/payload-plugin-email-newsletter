import type { CollectionConfig, Field, CollectionAfterChangeHook, CollectionBeforeDeleteHook } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { adminOnly, adminOrSelf } from '../utils/access'
import { renderEmail } from '../emails/render'

export const createSubscribersCollection = (
  pluginConfig: NewsletterPluginConfig
): CollectionConfig => {
  const slug = pluginConfig.subscribersSlug || 'subscribers'
  
  // Default fields for the subscribers collection
  const defaultFields: Field[] = [
    // Core fields
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Subscriber email address',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Subscriber full name',
      },
    },
    {
      name: 'locale',
      type: 'select',
      options: pluginConfig.i18n?.locales?.map(locale => ({
        label: locale.toUpperCase(),
        value: locale,
      })) || [
        { label: 'EN', value: 'en' },
      ],
      defaultValue: pluginConfig.i18n?.defaultLocale || 'en',
      admin: {
        description: 'Preferred language for communications',
      },
    },
    
    // Authentication fields (hidden from admin UI)
    {
      name: 'magicLinkToken',
      type: 'text',
      hidden: true,
    },
    {
      name: 'magicLinkTokenExpiry',
      type: 'date',
      hidden: true,
    },
    
    // Subscription status
    {
      name: 'subscriptionStatus',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Pending', value: 'pending' },
      ],
      defaultValue: 'pending',
      required: true,
      admin: {
        description: 'Current subscription status',
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: {
        condition: (data) => data?.subscriptionStatus === 'unsubscribed',
        description: 'When the user unsubscribed',
        readOnly: true,
      },
    },
    
    // Email preferences
    {
      name: 'emailPreferences',
      type: 'group',
      fields: [
        {
          name: 'newsletter',
          type: 'checkbox',
          defaultValue: true,
          label: 'Newsletter',
          admin: {
            description: 'Receive regular newsletter updates',
          },
        },
        {
          name: 'announcements',
          type: 'checkbox',
          defaultValue: true,
          label: 'Announcements',
          admin: {
            description: 'Receive important announcements',
          },
        },
      ],
      admin: {
        description: 'Email communication preferences',
      },
    },
    
    // Source tracking
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where the subscriber signed up from',
      },
    },
  ]

  // Add UTM tracking fields if enabled
  if (pluginConfig.features?.utmTracking?.enabled) {
    const utmFields = pluginConfig.features.utmTracking.fields || [
      'source',
      'medium',
      'campaign',
      'content',
      'term',
    ]
    
    defaultFields.push({
      name: 'utmParameters',
      type: 'group',
      fields: utmFields.map(field => ({
        name: field,
        type: 'text',
        admin: {
          description: `UTM ${field} parameter`,
        },
      })),
      admin: {
        description: 'UTM tracking parameters',
      },
    })
  }

  // Add signup metadata
  defaultFields.push({
    name: 'signupMetadata',
    type: 'group',
    fields: [
      {
        name: 'ipAddress',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'userAgent',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'referrer',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
      {
        name: 'signupPage',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
    ],
    admin: {
      description: 'Technical information about signup',
    },
  })

  // Add lead magnet field if enabled
  if (pluginConfig.features?.leadMagnets?.enabled) {
    defaultFields.push({
      name: 'leadMagnet',
      type: 'relationship',
      relationTo: pluginConfig.features.leadMagnets.collection || 'media',
      admin: {
        description: 'Lead magnet downloaded at signup',
      },
    })
  }

  // Allow field customization
  let fields = defaultFields
  if (pluginConfig.fields?.overrides) {
    fields = pluginConfig.fields.overrides({ defaultFields })
  }
  if (pluginConfig.fields?.additional) {
    fields = [...fields, ...pluginConfig.fields.additional]
  }

  const subscribersCollection: CollectionConfig = {
    slug,
    labels: {
      singular: 'Subscriber',
      plural: 'Subscribers',
    },
    admin: {
      useAsTitle: 'email',
      defaultColumns: ['email', 'name', 'subscriptionStatus', 'createdAt'],
      group: 'Newsletter',
    },
    fields,
    hooks: {
      afterChange: [
        async ({ doc, req, operation, previousDoc }) => {
          // After create logic
          if (operation === 'create') {
            // Add to email service
            const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
            if (emailService) {
              try {
                await emailService.addContact(doc)
              } catch {
                // Failed to add contact to email service
              }
            }

            // Send welcome email if active
            if (doc.subscriptionStatus === 'active' && emailService) {
              try {
                // Get settings for site name
                const settings = await req.payload.findGlobal({
                  slug: pluginConfig.settingsSlug || 'newsletter-settings',
                })
                
                // Render welcome email
                const serverURL = req.payload.config.serverURL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
                const html = await renderEmail('welcome', {
                  email: doc.email,
                  siteName: settings?.brandSettings?.siteName || 'Newsletter',
                  preferencesUrl: `${serverURL}/account/preferences`, // This could be customized
                })
                
                // Send email
                await emailService.send({
                  to: doc.email,
                  subject: settings?.brandSettings?.siteName ? `Welcome to ${settings.brandSettings.siteName}!` : 'Welcome!',
                  html,
                })
                
                console.info(`Welcome email sent to: ${doc.email}`)
              } catch (error) {
                console.error('Failed to send welcome email:', error)
                // Don't fail the subscription if welcome email fails
              }
            }

            // Custom after subscribe hook
            if (pluginConfig.hooks?.afterSubscribe) {
              await pluginConfig.hooks.afterSubscribe({ doc, req })
            }
          }
          
          // After update logic
          if (operation === 'update' && previousDoc) {
            // Update email service if status changed
            const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
            if (
              doc.subscriptionStatus !== previousDoc.subscriptionStatus &&
              emailService
            ) {
              try {
                await emailService.updateContact(doc)
              } catch {
                // Failed to update contact in email service
              }
            }

            // Handle unsubscribe
            if (
              doc.subscriptionStatus === 'unsubscribed' &&
              previousDoc.subscriptionStatus !== 'unsubscribed'
            ) {
              // Set unsubscribed timestamp
              doc.unsubscribedAt = new Date().toISOString()
              
              // Custom after unsubscribe hook
              if (pluginConfig.hooks?.afterUnsubscribe) {
                await pluginConfig.hooks.afterUnsubscribe({ doc, req })
              }
            }
          }
        },
      ] as CollectionAfterChangeHook[],
      beforeDelete: [
        async ({ id, req }) => {
          // Remove from email service
          const emailService = (req.payload as any).newsletterEmailService // TODO: Add proper type for newsletter email service
          if (emailService) {
            try {
              const doc = await req.payload.findByID({
                collection: slug,
                id,
              })
              await emailService.removeContact(doc.email)
            } catch {
              // Failed to remove contact from email service
            }
          }
        },
      ] as CollectionBeforeDeleteHook[],
    },
    access: {
      create: () => true, // Public can subscribe
      read: adminOrSelf(pluginConfig),
      update: adminOrSelf(pluginConfig),
      delete: adminOnly(pluginConfig),
    },
    timestamps: true,
  }

  return subscribersCollection
}