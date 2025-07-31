'use client'

// Import ONLY pure React components that don't have server dependencies
import { BroadcastInlinePreview } from './components/BroadcastInlinePreview'
import { StatusBadge } from './components/StatusBadge'
import { EmailPreview } from './components/EmailPreview'

// Re-export admin components
export {
  BroadcastInlinePreview,
  StatusBadge,
  EmailPreview,
}

// Export types that admin needs
export type {
  BroadcastInlinePreviewProps,
  StatusBadgeProps,
  EmailPreviewProps,
} from './types'