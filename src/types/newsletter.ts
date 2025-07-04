/**
 * Core types for newsletter management functionality
 */

/**
 * Represents a newsletter/broadcast in the system
 */
export interface Newsletter {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  content: string; // HTML content
  status: NewsletterStatus;
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
 * Possible statuses for a newsletter
 */
export enum NewsletterStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELED = 'canceled'
}

/**
 * Options for listing newsletters
 */
export interface ListNewsletterOptions {
  limit?: number;
  offset?: number;
  status?: NewsletterStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'sentAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from listing newsletters
 */
export interface ListNewsletterResponse<T = Newsletter> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Input for creating a new newsletter
 */
export interface CreateNewsletterInput {
  name: string;
  subject: string;
  preheader?: string;
  content: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  replyTo?: string;
  audienceIds?: string[]; // Maps to segments/audiences
}

/**
 * Input for updating an existing newsletter
 */
export interface UpdateNewsletterInput {
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
 * Options for sending a newsletter
 */
export interface SendNewsletterOptions {
  audienceIds?: string[]; // Target specific audiences
  testMode?: boolean; // Send test email
  testRecipients?: string[]; // Email addresses for test send
}

/**
 * Analytics data for a newsletter
 */
export interface NewsletterAnalytics {
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
 * Capabilities that a newsletter provider supports
 */
export interface NewsletterProviderCapabilities {
  supportsScheduling: boolean;
  supportsSegmentation: boolean;
  supportsAnalytics: boolean;
  supportsABTesting: boolean;
  supportsTemplates: boolean;
  supportsPersonalization: boolean;
  maxRecipientsPerSend?: number;
  editableStatuses: NewsletterStatus[];
  supportedContentTypes: ('html' | 'text' | 'react')[];
}

/**
 * Error types specific to newsletter operations
 */
export class NewsletterProviderError extends Error {
  constructor(
    message: string,
    public code: NewsletterErrorCode,
    public provider: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NewsletterProviderError';
  }
}

export enum NewsletterErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  INVALID_STATUS = 'INVALID_STATUS',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

/**
 * Newsletter template for reusable content
 */
export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables?: NewsletterTemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterTemplateVariable {
  name: string;
  type: 'text' | 'html' | 'image' | 'url';
  defaultValue?: string;
  required?: boolean;
}