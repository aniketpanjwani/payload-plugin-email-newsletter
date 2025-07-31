'use client'

// Admin-only components that use React hooks
export { BroadcastInlinePreview } from './components/Broadcasts/BroadcastInlinePreview'
export { StatusBadge } from './components/Broadcasts/StatusBadge'
export { EmailPreview } from './components/Broadcasts/EmailPreview'
export { BroadcastEditor } from './components/Broadcasts/BroadcastEditor'
export { EmailPreviewField } from './components/Broadcasts/EmailPreviewField'
export { BroadcastPreviewField } from './components/Broadcasts/BroadcastPreviewField'

// Context providers for admin components
export { PluginConfigProvider, usePluginConfig, usePluginConfigOptional } from './contexts/ClientContext'

// Fields that can be used in Payload admin
export { createBroadcastInlinePreviewField } from './fields/broadcastInlinePreview'
export { createBroadcastPreviewField } from './fields/broadcastPreview'
export { createEmailContentField } from './fields/emailContent'