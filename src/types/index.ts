import type { Field } from 'payload'
import type { BroadcastProvider } from './providers'

// Export broadcast types
export * from './broadcast'
export * from './providers'
// Export legacy newsletter types for backwards compatibility
export * from './newsletter'

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
   * Slug for the newsletter settings global
   * @default 'newsletter-settings'
   */
  settingsSlug?: string

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
   * Access control configuration
   */
  access?: {
    /**
     * Custom function to determine if a user is an admin
     * @param user - The authenticated user object
     * @returns true if the user should have admin access
     */
    isAdmin?: (user: any) => boolean
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
    afterUnsubscribeSync?: (args: AfterUnsubscribeSyncArgs) => void | Promise<void>
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
    
    /**
     * Unsubscribe sync configuration
     */
    unsubscribeSync?: {
      /**
       * Enable sync of unsubscribes from email service to Payload
       * @default false
       */
      enabled?: boolean
      /**
       * Cron schedule for sync job (e.g., '0 * * * *' for hourly)
       * If not provided, job must be triggered manually
       */
      schedule?: string
      /**
       * Queue name for the sync job
       * @default 'newsletter-sync'
       */
      queue?: string
    }
    
    /**
     * Newsletter management configuration
     */
    newsletterManagement?: {
      /**
       * Enable newsletter management features
       * @default false
       */
      enabled?: boolean
      /**
       * Collection names for broadcast management
       */
      collections?: {
        /**
         * Broadcasts collection slug
         * @default 'broadcasts'
         */
        broadcasts?: string
      }
      /**
       * Optional: Custom broadcast provider implementation
       * If not provided, will use the default email provider
       */
      provider?: BroadcastProvider
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
  fromEmail?: string
  fromAddress?: string // Alias for fromEmail
  fromName?: string
  replyTo?: string
  audienceIds?: {
    [locale: string]: {
      production?: string
      development?: string
    }
  }
}

export interface BroadcastProviderConfig {
  apiUrl: string
  token: string
  fromEmail?: string
  fromAddress?: string // Alias for fromEmail
  fromName?: string
  replyTo?: string
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
  // Additional fields that may exist in the database
  signupMetadata?: {
    ipAddress?: string
    userAgent?: string
    referrer?: string
    signupPage?: string
  }
  leadMagnet?: string
  unsubscribedAt?: string
  magicLinkToken?: string
  magicLinkTokenExpiry?: string
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
  styles?: {
    form?: React.CSSProperties
    inputGroup?: React.CSSProperties
    label?: React.CSSProperties
    input?: React.CSSProperties
    button?: React.CSSProperties
    buttonDisabled?: React.CSSProperties
    error?: React.CSSProperties
    success?: React.CSSProperties
    checkbox?: React.CSSProperties
    checkboxInput?: React.CSSProperties
    checkboxLabel?: React.CSSProperties
  }
  apiEndpoint?: string
  buttonText?: string
  loadingText?: string
  successMessage?: string
  placeholders?: {
    email?: string
    name?: string
  }
  labels?: {
    email?: string
    name?: string
    newsletter?: string
    announcements?: string
  }
}

export interface PreferencesFormProps {
  subscriber?: Subscriber
  onSuccess?: (subscriber: Subscriber) => void
  onError?: (error: Error) => void
  className?: string
  styles?: {
    container?: React.CSSProperties
    heading?: React.CSSProperties
    form?: React.CSSProperties
    section?: React.CSSProperties
    sectionTitle?: React.CSSProperties
    inputGroup?: React.CSSProperties
    label?: React.CSSProperties
    input?: React.CSSProperties
    select?: React.CSSProperties
    checkbox?: React.CSSProperties
    checkboxInput?: React.CSSProperties
    checkboxLabel?: React.CSSProperties
    buttonGroup?: React.CSSProperties
    button?: React.CSSProperties
    primaryButton?: React.CSSProperties
    secondaryButton?: React.CSSProperties
    dangerButton?: React.CSSProperties
    error?: React.CSSProperties
    success?: React.CSSProperties
    info?: React.CSSProperties
  }
  sessionToken?: string
  apiEndpoint?: string
  showUnsubscribe?: boolean
  locales?: string[]
  labels?: {
    title?: string
    personalInfo?: string
    emailPreferences?: string
    name?: string
    language?: string
    newsletter?: string
    announcements?: string
    saveButton?: string
    unsubscribeButton?: string
    saving?: string
    saved?: string
    unsubscribeConfirm?: string
  }
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

export interface AfterUnsubscribeSyncArgs {
  req: any
  syncedCount: number
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'multiselect' | 'radio'
  options?: string[]
  required?: boolean
}

// Request data interfaces for endpoints
export interface SubscribeRequestData {
  email: string
  name?: string
  source?: string
  preferences?: { [key: string]: boolean }
  leadMagnet?: string
  surveyResponses?: { [key: string]: string | string[] }
  metadata?: {
    locale?: string
    signupPage?: string
    [key: string]: unknown
  }
}

export interface UnsubscribeRequestData {
  email?: string
  token?: string
}

export interface VerifyMagicLinkRequestData {
  token: string
}

export interface SigninRequestData {
  email: string
}

export interface UpdatePreferencesRequestData {
  name?: string
  locale?: string
  emailPreferences?: { [key: string]: boolean }
}

// Extended request types with proper data typing
export interface ExtendedPayloadRequest extends Request {
  payload: any // TODO: Add proper payload type
  data?: unknown
  ip?: string
  connection?: {
    remoteAddress?: string
  }
  cookies?: {
    [key: string]: string
  }
  // Headers are inherited from Request, but we document common ones for reference
  // Access via: req.headers.get('authorization'), req.headers.get('referer'), etc.
}