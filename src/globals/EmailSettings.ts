import type { GlobalConfig } from 'payload'
import type { NewsletterPluginConfig } from '../types'

export const createEmailSettingsGlobal = (
  pluginConfig: NewsletterPluginConfig
): GlobalConfig => {
  return {
    slug: 'newsletter-settings',
    label: 'Newsletter Settings',
    admin: {
      group: 'Settings',
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
                    label: 'Audience IDs',
                    labels: {
                      singular: 'Audience',
                      plural: 'Audiences',
                    },
                    fields: [
                      {
                        name: 'locale',
                        type: 'text',
                        label: 'Locale',
                        required: true,
                        admin: {
                          description: 'Language/locale code (e.g., en, es)',
                        },
                      },
                      {
                        name: 'production',
                        type: 'text',
                        label: 'Production Audience ID',
                        admin: {
                          description: 'Audience ID for production environment',
                        },
                      },
                      {
                        name: 'development',
                        type: 'text',
                        label: 'Development Audience ID',
                        admin: {
                          description: 'Audience ID for development environment',
                        },
                      },
                    ],
                    admin: {
                      description: 'Configure audience IDs for different locales',
                    },
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
                    label: 'Broadcast API URL',
                    required: true,
                    admin: {
                      description: 'Your Broadcast installation URL (e.g., https://broadcast.yourdomain.com)',
                    },
                  },
                  {
                    name: 'productionToken',
                    type: 'text',
                    label: 'Broadcast API Token (Production)',
                    admin: {
                      description: 'API token for your production channel from Broadcast Access Tokens page',
                    },
                  },
                  {
                    name: 'developmentToken',
                    type: 'text',
                    label: 'Broadcast API Token (Development)',
                    admin: {
                      description: 'API token for your development channel from Broadcast Access Tokens page',
                    },
                  },
                ],
              },
            ],
          },
          {
            label: 'Email Templates',
            fields: [
              {
                name: 'fromAddress',
                type: 'email',
                label: 'From Email Address',
                required: true,
                admin: {
                  description: 'Email address that newsletters will be sent from',
                },
              },
              {
                name: 'fromName',
                type: 'text',
                label: 'From Name',
                required: true,
                admin: {
                  description: 'Name that appears as the sender',
                },
              },
              {
                name: 'replyTo',
                type: 'email',
                label: 'Reply-To Address',
                admin: {
                  description: 'Email address for replies (optional)',
                },
              },
              {
                name: 'emailFooter',
                type: 'richText',
                label: 'Email Footer',
                admin: {
                  description: 'Footer content that appears in all emails',
                },
              },
            ],
          },
          {
            label: 'Subscription Settings',
            fields: [
              {
                name: 'requireDoubleOptIn',
                type: 'checkbox',
                label: 'Require Double Opt-In',
                defaultValue: false,
                admin: {
                  description: 'Require email confirmation before activating subscription',
                },
              },
              {
                name: 'welcomeEmailDelay',
                type: 'number',
                label: 'Welcome Email Delay',
                defaultValue: 0,
                min: 0,
                admin: {
                  description: 'Delay in minutes before sending welcome email',
                },
              },
              {
                name: 'allowedDomains',
                type: 'array',
                label: 'Allowed Email Domains',
                labels: {
                  singular: 'Domain',
                  plural: 'Domains',
                },
                admin: {
                  description: 'Restrict signups to specific email domains (leave empty to allow all)',
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
                label: 'Max Subscribers Per IP',
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
    hooks: {
      afterChange: [
        async ({ doc, req }) => {
          // Reinitialize email service with new settings
          if ((req.payload as any).newsletterEmailService) {
            try {
              // TODO: Implement email service reinitialization
              console.log('Email settings updated, reinitializing service...')
            } catch (error) {
              console.error('Failed to reinitialize email service:', error)
            }
          }
        },
      ],
    },
    access: {
      read: ({ req: { user } }) => Boolean(user),
      update: ({ req: { user } }) => Boolean(user?.collection === 'users'),
    },
  }
}