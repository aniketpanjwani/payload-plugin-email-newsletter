'use client'

// Re-export all components from the client export
// This allows users to import directly from @payloadcms/plugin-newsletter/components
export * from './client'

// Email preview components
export { EmailPreview } from '../components/Broadcasts/EmailPreview'
export { EmailPreviewField } from '../components/Broadcasts/EmailPreviewField'
export { BroadcastEditor } from '../components/Broadcasts/BroadcastEditor'