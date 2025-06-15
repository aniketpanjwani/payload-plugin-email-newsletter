'use client'

// React components
export { 
  NewsletterForm, 
  createNewsletterForm,
  PreferencesForm,
  createPreferencesForm,
  MagicLinkVerify,
  createMagicLinkVerify,
} from '../components'

// Hooks
export { useNewsletterAuth } from '../hooks/useNewsletterAuth'

// Types for client-side use
export type {
  SignupFormProps,
  PreferencesFormProps,
  Subscriber,
} from '../types'

export type {
  MagicLinkVerifyProps,
} from '../components'

export type {
  UseNewsletterAuthOptions,
  UseNewsletterAuthReturn,
} from '../hooks/useNewsletterAuth'