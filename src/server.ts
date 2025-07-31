// Server-safe exports only - NO React components
export { newsletterPlugin } from './index'
export type { NewsletterPluginConfig } from './types'
export type { Subscriber } from './types'

// Export server-safe utilities
export { createSubscribeEndpoint } from './endpoints/subscribe'
export { createUnsubscribeEndpoint } from './endpoints/unsubscribe'
export { createPreferencesEndpoint } from './endpoints/preferences'
export { createVerifyMagicLinkEndpoint } from './endpoints/verify-magic-link'

// Export collection creators
export { createSubscribersCollection } from './collections/Subscribers'
export { createBroadcastsCollection } from './collections/Broadcasts'
export { createNewsletterSettingsGlobal } from './globals/NewsletterSettings'

// Export email providers
export { ResendProvider } from './providers/resend'
export { BroadcastProvider } from './providers/broadcast'