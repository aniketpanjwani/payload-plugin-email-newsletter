import type { Config, CollectionConfig, GlobalConfig, Field, Endpoint } from 'payload'

export interface NewsletterPluginConfig {
  /**
   * Enable or disable the plugin
   * @default true
   */
  enabled?: boolean

  /**
   * Slug for the subscribers collection
   * @default 'subscribers'
   */
  subscribersSlug?: string

  /**
   * Authentication configuration for magic links
   */
  auth?: {
    /**
     * Enable magic link authentication
     * @default true
     */
    enabled?: boolean
    
    /**
     * Token expiration time
     * @default '7d'
     */
    tokenExpiration?: string
    
    /**
     * Path where magic link redirects
     * @default '/newsletter/verify'
     */
    magicLinkPath?: string
  }

  /**
   * Email provider configuration
   */
  providers: {
    /**
     * Default provider to use
     */
    default: 'resend' | 'broadcast' | string
    
    /**
     * Resend provider configuration
     */
    resend?: ResendProviderConfig
    
    /**
     * Broadcast provider configuration
     */
    broadcast?: BroadcastProviderConfig
  }

  /**
   * Field customization options
   */
  fields?: {
    /**
     * Override default fields
     */
    overrides?: (args: { defaultFields: Field[] }) => Field[]
    
    /**
     * Additional custom fields
     */
    additional?: Field[]
  }

  /**
   * Email template components
   */
  templates?: {
    /**
     * Welcome email template
     */
    welcome?: React.ComponentType<WelcomeEmailProps>
    
    /**
     * Magic link email template
     */
    magicLink?: React.ComponentType<MagicLinkEmailProps>
  }

  /**
   * Plugin hooks
   */
  hooks?: {
    beforeSubscribe?: (args: BeforeSubscribeArgs) => void | Promise<void>
    afterSubscribe?: (args: AfterSubscribeArgs) => void | Promise<void>
    beforeUnsubscribe?: (args: BeforeUnsubscribeArgs) => void | Promise<void>
    afterUnsubscribe?: (args: AfterUnsubscribeArgs) => void | Promise<void>
  }

  /**
   * UI component overrides
   */
  components?: {
    signupForm?: React.ComponentType<SignupFormProps>
    preferencesForm?: React.ComponentType<PreferencesFormProps>
  }

  /**
   * Feature flags
   */
  features?: {
    /**
     * Lead magnet configuration
     */
    leadMagnets?: {
      enabled?: boolean
      collection?: string
    }
    
    /**
     * Post-signup survey configuration
     */
    surveys?: {
      enabled?: boolean
      questions?: SurveyQuestion[]
    }
    
    /**
     * UTM tracking configuration
     */
    utmTracking?: {
      enabled?: boolean
      fields?: string[]
    }
    
    /**
     * Newsletter scheduling configuration
     */
    newsletterScheduling?: {
      enabled?: boolean
      /**
       * Collections to add newsletter fields to
       * Can be a string for single collection or array for multiple
       * @example 'articles' or ['articles', 'posts', 'updates']
       */
      collections?: string | string[]
      /**
       * Field configuration
       */
      fields?: {
        /**
         * Group name for newsletter fields
         * @default 'newsletterScheduling'
         */
        groupName?: string
        /**
         * Rich text field name to use for content
         * @default 'content'
         */
        contentField?: string
        /**
         * Whether to create a markdown companion field
         * @default true
         */
        createMarkdownField?: boolean
      }
    }
  }

  /**
   * Internationalization configuration
   */
  i18n?: {
    defaultLocale?: string
    locales?: string[]
  }
}

export interface ResendProviderConfig {
  apiKey: string
  fromAddress?: string
  fromName?: string
  audienceIds?: {
    [locale: string]: {
      production?: string
      development?: string
    }
  }
}

export interface BroadcastProviderConfig {
  apiUrl: string
  tokens: {
    production?: string
    development?: string
  }
  fromAddress?: string
  fromName?: string
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<void>
  addContact(contact: Subscriber): Promise<void>
  updateContact(contact: Subscriber): Promise<void>
  removeContact(email: string): Promise<void>
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
}

export interface Subscriber {
  id: string
  email: string
  name?: string
  locale?: string
  subscriptionStatus: 'active' | 'unsubscribed' | 'pending'
  emailPreferences?: {
    newsletter?: boolean
    announcements?: boolean
    [key: string]: boolean | undefined
  }
  source?: string
  utmParameters?: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
  createdAt: string
  updatedAt: string
}

export interface WelcomeEmailProps {
  subscriber: Subscriber
  unsubscribeUrl: string
  preferencesUrl: string
}

export interface MagicLinkEmailProps {
  magicLinkUrl: string
  subscriber: Subscriber
}

export interface SignupFormProps {
  onSuccess?: (subscriber: Subscriber) => void
  onError?: (error: Error) => void
  showName?: boolean
  showPreferences?: boolean
  leadMagnet?: {
    id: string
    title: string
    description?: string
  }
  className?: string
}

export interface PreferencesFormProps {
  subscriber: Subscriber
  onSuccess?: (subscriber: Subscriber) => void
  onError?: (error: Error) => void
  className?: string
}

export interface BeforeSubscribeArgs {
  data: Partial<Subscriber>
  req: any
}

export interface AfterSubscribeArgs {
  doc: Subscriber
  req: any
}

export interface BeforeUnsubscribeArgs {
  email: string
  req: any
}

export interface AfterUnsubscribeArgs {
  doc: Subscriber
  req: any
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'multiselect' | 'radio'
  options?: string[]
  required?: boolean
}