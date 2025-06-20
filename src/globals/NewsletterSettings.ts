import type { GlobalConfig } from 'payload'
import type { NewsletterPluginConfig } from '../types'
import { adminOnly } from '../utils/access'

export const createNewsletterSettingsGlobal = (
  pluginConfig: NewsletterPluginConfig
): GlobalConfig => {
  const slug = pluginConfig.settingsSlug || 'newsletter-settings'
  
  return {
    slug,
    label: 'Newsletter Settings',
    admin: {
      group: 'Newsletter',
      description: 'Configure email provider settings and templates',
    },
    fields: [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Provider Settings',
            fields: [
              {
                name: 'provider',
                type: 'select',
                label: 'Email Provider',
                required: true,
                options: [
                  { label: 'Resend', value: 'resend' },
                  { label: 'Broadcast (Self-Hosted)', value: 'broadcast' },
                ],
                defaultValue: pluginConfig.providers.default,
                admin: {
                  description: 'Choose which email service to use',
                },
              },
              {
                name: 'resendSettings',
                type: 'group',
                label: 'Resend Settings',
                admin: {
                  condition: (data) => data?.provider === 'resend',
                },
                fields: [
                  {
                    name: 'apiKey',
                    type: 'text',
                    label: 'API Key',
                    required: true,
                    admin: {
                      description: 'Your Resend API key',
                    },
                  },
                  {
                    name: 'audienceIds',
                    type: 'array',
                    label: 'Audience IDs by Locale',
                    fields: [
                      {
                        name: 'locale',
                        type: 'select',
                        label: 'Locale',
                        required: true,
                        options: pluginConfig.i18n?.locales?.map(locale => ({
                          label: locale.toUpperCase(),
                          value: locale,
                        })) || [
                          { label: 'EN', value: 'en' },
                        ],
                      },
                      {
                        name: 'production',
                        type: 'text',
                        label: 'Production Audience ID',
                      },
                      {
                        name: 'development',
                        type: 'text',
                        label: 'Development Audience ID',
                      },
                    ],
                  },
                ],
              },
              {
                name: 'broadcastSettings',
                type: 'group',
                label: 'Broadcast Settings',
                admin: {
                  condition: (data) => data?.provider === 'broadcast',
                },
                fields: [
                  {
                    name: 'apiUrl',
                    type: 'text',
                    label: 'API URL',
                    required: true,
                    admin: {
                      description: 'Your Broadcast instance URL',
                    },
                  },
                  {
                    name: 'productionToken',
                    type: 'text',
                    label: 'Production Token',
                    admin: {
                      description: 'Token for production environment',
                    },
                  },
                  {
                    name: 'developmentToken',
                    type: 'text',
                    label: 'Development Token',
                    admin: {
                      description: 'Token for development environment',
                    },
                  },
                ],
              },
              {
                name: 'fromAddress',
                type: 'email',
                label: 'From Address',
                required: true,
                admin: {
                  description: 'Default sender email address',
                },
              },
              {
                name: 'fromName',
                type: 'text',
                label: 'From Name',
                required: true,
                admin: {
                  description: 'Default sender name',
                },
              },
              {
                name: 'replyTo',
                type: 'email',
                label: 'Reply-To Address',
                admin: {
                  description: 'Optional reply-to email address',
                },
              },
            ],
          },
          {
            label: 'Email Templates',
            fields: [
              {
                name: 'emailTemplates',
                type: 'group',
                label: 'Email Templates',
                fields: [
                  {
                    name: 'welcome',
                    type: 'group',
                    label: 'Welcome Email',
                    fields: [
                      {
                        name: 'enabled',
                        type: 'checkbox',
                        label: 'Send Welcome Email',
                        defaultValue: true,
                      },
                      {
                        name: 'subject',
                        type: 'text',
                        label: 'Subject Line',
                        defaultValue: 'Welcome to {{fromName}}!',
                        admin: {
                          condition: (data) => data?.emailTemplates?.welcome?.enabled,
                        },
                      },
                      {
                        name: 'preheader',
                        type: 'text',
                        label: 'Preheader Text',
                        admin: {
                          condition: (data) => data?.emailTemplates?.welcome?.enabled,
                        },
                      },
                    ],
                  },
                  {
                    name: 'magicLink',
                    type: 'group',
                    label: 'Magic Link Email',
                    fields: [
                      {
                        name: 'subject',
                        type: 'text',
                        label: 'Subject Line',
                        defaultValue: 'Sign in to {{fromName}}',
                      },
                      {
                        name: 'preheader',
                        type: 'text',
                        label: 'Preheader Text',
                        defaultValue: 'Click the link to access your preferences',
                      },
                      {
                        name: 'expirationTime',
                        type: 'select',
                        label: 'Link Expiration',
                        defaultValue: '7d',
                        options: [
                          { label: '1 hour', value: '1h' },
                          { label: '24 hours', value: '24h' },
                          { label: '7 days', value: '7d' },
                          { label: '30 days', value: '30d' },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            label: 'Subscription Settings',
            fields: [
              {
                name: 'subscriptionSettings',
                type: 'group',
                label: 'Subscription Settings',
                fields: [
                  {
                    name: 'requireDoubleOptIn',
                    type: 'checkbox',
                    label: 'Require Double Opt-In',
                    defaultValue: false,
                    admin: {
                      description: 'Require email confirmation before activating subscriptions',
                    },
                  },
                  {
                    name: 'allowedDomains',
                    type: 'array',
                    label: 'Allowed Email Domains',
                    admin: {
                      description: 'Leave empty to allow all domains',
                    },
                    fields: [
                      {
                        name: 'domain',
                        type: 'text',
                        label: 'Domain',
                        required: true,
                        admin: {
                          placeholder: 'example.com',
                        },
                      },
                    ],
                  },
                  {
                    name: 'maxSubscribersPerIP',
                    type: 'number',
                    label: 'Max Subscribers per IP',
                    defaultValue: 10,
                    min: 1,
                    admin: {
                      description: 'Maximum number of subscriptions allowed from a single IP address',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    hooks: {
      beforeChange: [
        async ({ data, req }) => {
          // Verify admin access for settings changes
          if (!req.user || req.user.collection !== 'users') {
            throw new Error('Only administrators can modify newsletter settings')
          }
          
          return data
        },
      ],
      afterChange: [
        async ({ doc, req }) => {
          // Reinitialize email service when settings change
          if ((req.payload as any).newsletterEmailService) {
            try {
              // TODO: Implement email service reinitialization
              console.warn('Newsletter settings updated, reinitializing service...')
            } catch {
              // Failed to reinitialize email service
            }
          }
          
          return doc
        },
      ],
    },
    access: {
      read: () => true, // Settings can be read publicly for validation
      update: adminOnly(pluginConfig),
    },
  }
}