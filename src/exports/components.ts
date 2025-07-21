'use client'

// Re-export all components from the client export
// This allows users to import directly from @payloadcms/plugin-newsletter/components
export * from './client'

// Email preview components
export { EmailPreview } from '../components/Broadcasts/EmailPreview'
export { EmailPreviewField } from '../components/Broadcasts/EmailPreviewField'
export { BroadcastEditor } from '../components/Broadcasts/BroadcastEditor'

// Broadcast preview components
export { BroadcastInlinePreview } from '../components/Broadcasts/BroadcastInlinePreview'
export { BroadcastPreviewField } from '../components/Broadcasts/BroadcastPreviewField'
export { PreviewControls } from '../components/Broadcasts/PreviewControls'
export { EmailRenderer } from '../components/Broadcasts/EmailRenderer'

// List view components
export { StatusBadge } from '../components/Broadcasts/StatusBadge'
export { ActionsCell } from '../components/Broadcasts/ActionsCell'
export { EmptyField } from '../components/Broadcasts/EmptyField'

// Email templates
export { DefaultBroadcastTemplate } from '../email-templates/DefaultBroadcastTemplate'
export type { BroadcastTemplateProps } from '../email-templates/DefaultBroadcastTemplate'