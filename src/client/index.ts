'use client'

// Client-only exports with proper directives
export { NewsletterForm } from '../components/NewsletterForm'
export { PreferencesForm } from '../components/PreferencesForm'
export { MagicLinkVerify } from '../components/MagicLinkVerify'
export { useNewsletterAuth } from '../hooks/useNewsletterAuth'

// Re-export helpers
export { createNewsletterForm } from '../components/NewsletterForm'
export { createPreferencesForm } from '../components/PreferencesForm'
export { createMagicLinkVerify } from '../components/MagicLinkVerify'

// Export types for client components
export type { MagicLinkVerifyProps } from '../components/MagicLinkVerify'