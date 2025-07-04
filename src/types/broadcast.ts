/**
 * Core types for broadcast management functionality
 */

/**
 * Represents a broadcast (individual email campaign) in the system
 */
export interface Broadcast {
  id: string;
  channelId: string; // Reference to the channel this broadcast belongs to
  name: string;
  subject: string;
  preheader?: string;
  content: string; // HTML content
  status: BroadcastStatus;
  trackOpens: boolean;
  trackClicks: boolean;
  replyTo?: string;
  recipientCount?: number;
  sentAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Provider-specific data stored here
  providerData?: Record<string, any>;
  // Provider information
  providerId?: string;
  providerType?: 'broadcast' | 'resend';
}

/**
 * Possible statuses for a broadcast
 */
export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELED = 'canceled'
}

/**
 * Options for listing broadcasts
 */
export interface ListBroadcastOptions {
  limit?: number;
  offset?: number;
  status?: BroadcastStatus;
  channelId?: string; // Filter by channel
  sortBy?: 'createdAt' | 'updatedAt' | 'sentAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from listing broadcasts
 */
export interface ListBroadcastResponse<T = Broadcast> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Input for creating a new broadcast
 */
export interface CreateBroadcastInput {
  channelId: string; // Which channel to send to
  name: string;
  subject: string;
  preheader?: string;
  content: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  replyTo?: string;
  audienceIds?: string[]; // Maps to segments/audiences within the channel
}

/**
 * Input for updating an existing broadcast
 */
export interface UpdateBroadcastInput {
  name?: string;
  subject?: string;
  preheader?: string;
  content?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  replyTo?: string;
  audienceIds?: string[];
}

/**
 * Options for sending a broadcast
 */
export interface SendBroadcastOptions {
  audienceIds?: string[]; // Target specific audiences within the channel
  testMode?: boolean; // Send test email
  testRecipients?: string[]; // Email addresses for test send
}

/**
 * Analytics data for a broadcast
 */
export interface BroadcastAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  bounceRate?: number;
}

/**
 * Capabilities that a broadcast provider supports
 */
export interface BroadcastProviderCapabilities {
  supportsScheduling: boolean;
  supportsSegmentation: boolean;
  supportsAnalytics: boolean;
  supportsABTesting: boolean;
  supportsTemplates: boolean;
  supportsPersonalization: boolean;
  maxRecipientsPerSend?: number;
  editableStatuses: BroadcastStatus[];
  supportedContentTypes: ('html' | 'text' | 'react')[];
  // Channel-specific capabilities
  supportsMultipleChannels: boolean;
  supportsChannelSegmentation: boolean;
}

/**
 * Error types specific to broadcast operations
 */
export class BroadcastProviderError extends Error {
  constructor(
    message: string,
    public code: BroadcastErrorCode,
    public provider: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BroadcastProviderError';
  }
}

export enum BroadcastErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  INVALID_STATUS = 'INVALID_STATUS',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  INVALID_CHANNEL = 'INVALID_CHANNEL'
}

/**
 * Broadcast template for reusable content
 */
export interface BroadcastTemplate {
  id: string;
  channelId?: string; // Optional channel-specific template
  name: string;
  description?: string;
  content: string;
  variables?: BroadcastTemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BroadcastTemplateVariable {
  name: string;
  type: 'text' | 'html' | 'image' | 'url';
  defaultValue?: string;
  required?: boolean;
}

// Re-export newsletter types with deprecation notice for backwards compatibility
export {
  NewsletterStatus,
  type ListNewsletterOptions,
  type ListNewsletterResponse,
  type CreateNewsletterInput,
  type UpdateNewsletterInput,
  type SendNewsletterOptions,
  type NewsletterAnalytics,
  type NewsletterProviderCapabilities,
  NewsletterProviderError,
  NewsletterErrorCode,
  type NewsletterTemplate,
  type NewsletterTemplateVariable
} from './newsletter';