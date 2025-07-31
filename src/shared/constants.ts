// Shared constants that can be used in both server and client

export const NEWSLETTER_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  FAILED: 'failed',
} as const

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  UNSUBSCRIBED: 'unsubscribed',
  PENDING: 'pending',
} as const