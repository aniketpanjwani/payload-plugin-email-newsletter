/**
 * Provider interfaces for broadcast management
 */

// Import broadcast types
import type {
  Broadcast,
  BroadcastStatus,
  ListBroadcastOptions,
  ListBroadcastResponse,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  SendBroadcastOptions,
  BroadcastAnalytics,
  BroadcastProviderCapabilities
} from './broadcast'

import {
  BroadcastProviderError,
  BroadcastErrorCode
} from './broadcast'

// Import channel types
import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
  ListChannelsOptions,
  ListChannelsResponse
} from './channel'

// Import legacy newsletter types for backwards compatibility
import type {
  Newsletter,
  NewsletterStatus,
  ListNewsletterOptions,
  ListNewsletterResponse,
  CreateNewsletterInput,
  UpdateNewsletterInput,
  SendNewsletterOptions,
  NewsletterAnalytics,
  NewsletterProviderCapabilities
} from './newsletter'

import {
  NewsletterProviderError,
  NewsletterErrorCode
} from './newsletter'

/**
 * Main interface for broadcast providers
 */
export interface BroadcastProvider {
  /**
   * Get the provider name
   */
  readonly name: string;

  // Channel management methods
  /**
   * List channels (newsletter types/publications)
   */
  listChannels(options?: ListChannelsOptions): Promise<ListChannelsResponse>;
  
  /**
   * Get a specific channel by ID
   */
  getChannel(id: string): Promise<Channel>;
  
  /**
   * Create a new channel
   */
  createChannel(data: CreateChannelInput): Promise<Channel>;
  
  /**
   * Update an existing channel
   */
  updateChannel(id: string, data: UpdateChannelInput): Promise<Channel>;
  
  /**
   * Delete a channel
   */
  deleteChannel(id: string): Promise<void>;

  // Broadcast management methods
  /**
   * List broadcasts with pagination
   */
  list(options?: ListBroadcastOptions): Promise<ListBroadcastResponse<Broadcast>>;
  
  /**
   * Get a specific broadcast by ID
   */
  get(id: string): Promise<Broadcast>;
  
  /**
   * Create a new broadcast
   */
  create(data: CreateBroadcastInput): Promise<Broadcast>;
  
  /**
   * Update an existing broadcast
   */
  update(id: string, data: UpdateBroadcastInput): Promise<Broadcast>;
  
  /**
   * Delete a broadcast
   */
  delete(id: string): Promise<void>;
  
  /**
   * Send a broadcast immediately or to test recipients
   */
  send(id: string, options?: SendBroadcastOptions): Promise<Broadcast>;
  
  /**
   * Schedule a broadcast for future sending
   */
  schedule(id: string, scheduledAt: Date): Promise<Broadcast>;
  
  /**
   * Cancel a scheduled broadcast
   */
  cancelSchedule(id: string): Promise<Broadcast>;
  
  /**
   * Get analytics for a broadcast
   */
  getAnalytics(id: string): Promise<BroadcastAnalytics>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): BroadcastProviderCapabilities;
  
  /**
   * Validate that the provider is properly configured
   */
  validateConfiguration(): Promise<boolean>;
}

/**
 * Legacy newsletter provider interface for backwards compatibility
 * @deprecated Use BroadcastProvider instead
 */
export interface NewsletterProvider {
  /**
   * Get the provider name
   */
  readonly name: string;

  /**
   * List newsletters with pagination
   */
  list(options?: ListNewsletterOptions): Promise<ListNewsletterResponse<Newsletter>>;
  
  /**
   * Get a specific newsletter by ID
   */
  get(id: string): Promise<Newsletter>;
  
  /**
   * Create a new newsletter
   */
  create(data: CreateNewsletterInput): Promise<Newsletter>;
  
  /**
   * Update an existing newsletter
   */
  update(id: string, data: UpdateNewsletterInput): Promise<Newsletter>;
  
  /**
   * Delete a newsletter
   */
  delete(id: string): Promise<void>;
  
  /**
   * Send a newsletter immediately or to test recipients
   */
  send(id: string, options?: SendNewsletterOptions): Promise<Newsletter>;
  
  /**
   * Schedule a newsletter for future sending
   */
  schedule(id: string, scheduledAt: Date): Promise<Newsletter>;
  
  /**
   * Cancel a scheduled newsletter
   */
  cancelSchedule(id: string): Promise<Newsletter>;
  
  /**
   * Get analytics for a newsletter
   */
  getAnalytics(id: string): Promise<NewsletterAnalytics>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): NewsletterProviderCapabilities;
  
  /**
   * Validate that the provider is properly configured
   */
  validateConfiguration(): Promise<boolean>;
}

/**
 * Base abstract class for broadcast providers
 */
export abstract class BaseBroadcastProvider implements BroadcastProvider {
  abstract readonly name: string;
  
  constructor(protected config: any) {}
  
  // Channel management - abstract methods
  abstract listChannels(options?: ListChannelsOptions): Promise<ListChannelsResponse>;
  abstract getChannel(id: string): Promise<Channel>;
  abstract createChannel(data: CreateChannelInput): Promise<Channel>;
  abstract updateChannel(id: string, data: UpdateChannelInput): Promise<Channel>;
  abstract deleteChannel(id: string): Promise<void>;
  
  // Broadcast management - abstract methods
  abstract list(options?: ListBroadcastOptions): Promise<ListBroadcastResponse<Broadcast>>;
  abstract get(id: string): Promise<Broadcast>;
  abstract create(data: CreateBroadcastInput): Promise<Broadcast>;
  abstract update(id: string, data: UpdateBroadcastInput): Promise<Broadcast>;
  abstract delete(id: string): Promise<void>;
  abstract send(id: string, options?: SendBroadcastOptions): Promise<Broadcast>;
  abstract getCapabilities(): BroadcastProviderCapabilities;
  abstract validateConfiguration(): Promise<boolean>;
  
  /**
   * Schedule a broadcast - default implementation throws not supported
   */
  async schedule(id: string, scheduledAt: Date): Promise<Broadcast> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsScheduling) {
      throw new BroadcastProviderError(
        'Scheduling is not supported by this provider',
        BroadcastErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    throw new Error('Method not implemented');
  }
  
  /**
   * Cancel scheduled broadcast - default implementation throws not supported
   */
  async cancelSchedule(id: string): Promise<Broadcast> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsScheduling) {
      throw new BroadcastProviderError(
        'Scheduling is not supported by this provider',
        BroadcastErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    throw new Error('Method not implemented');
  }
  
  /**
   * Get analytics - default implementation returns zeros
   */
  async getAnalytics(id: string): Promise<BroadcastAnalytics> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsAnalytics) {
      throw new BroadcastProviderError(
        'Analytics are not supported by this provider',
        BroadcastErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0
    };
  }
  
  /**
   * Helper method to validate required fields
   */
  protected validateRequiredFields(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new BroadcastProviderError(
        `Missing required fields: ${missing.join(', ')}`,
        BroadcastErrorCode.VALIDATION_ERROR,
        this.name
      );
    }
  }
  
  /**
   * Helper method to check if a status transition is allowed
   */
  protected canEditInStatus(status: BroadcastStatus): boolean {
    const capabilities = this.getCapabilities();
    return capabilities.editableStatuses.includes(status);
  }
  
  /**
   * Helper to build pagination response
   */
  protected buildListResponse<T>(
    items: T[],
    total: number,
    options: ListBroadcastOptions = {}
  ): ListBroadcastResponse<T> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    };
  }
}

/**
 * Base abstract class for newsletter providers
 * @deprecated Use BaseBroadcastProvider instead
 */
export abstract class BaseNewsletterProvider implements NewsletterProvider {
  abstract readonly name: string;
  
  constructor(protected config: any) {}
  
  abstract list(options?: ListNewsletterOptions): Promise<ListNewsletterResponse<Newsletter>>;
  abstract get(id: string): Promise<Newsletter>;
  abstract create(data: CreateNewsletterInput): Promise<Newsletter>;
  abstract update(id: string, data: UpdateNewsletterInput): Promise<Newsletter>;
  abstract delete(id: string): Promise<void>;
  abstract send(id: string, options?: SendNewsletterOptions): Promise<Newsletter>;
  abstract getCapabilities(): NewsletterProviderCapabilities;
  abstract validateConfiguration(): Promise<boolean>;
  
  /**
   * Schedule a newsletter - default implementation throws not supported
   */
  async schedule(id: string, scheduledAt: Date): Promise<Newsletter> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsScheduling) {
      throw new NewsletterProviderError(
        'Scheduling is not supported by this provider',
        NewsletterErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    throw new Error('Method not implemented');
  }
  
  /**
   * Cancel scheduled newsletter - default implementation throws not supported
   */
  async cancelSchedule(id: string): Promise<Newsletter> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsScheduling) {
      throw new NewsletterProviderError(
        'Scheduling is not supported by this provider',
        NewsletterErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    throw new Error('Method not implemented');
  }
  
  /**
   * Get analytics - default implementation returns zeros
   */
  async getAnalytics(id: string): Promise<NewsletterAnalytics> {
    const capabilities = this.getCapabilities();
    if (!capabilities.supportsAnalytics) {
      throw new NewsletterProviderError(
        'Analytics are not supported by this provider',
        NewsletterErrorCode.NOT_SUPPORTED,
        this.name
      );
    }
    
    return {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0
    };
  }
  
  /**
   * Helper method to validate required fields
   */
  protected validateRequiredFields(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new NewsletterProviderError(
        `Missing required fields: ${missing.join(', ')}`,
        NewsletterErrorCode.VALIDATION_ERROR,
        this.name
      );
    }
  }
  
  /**
   * Helper method to check if a status transition is allowed
   */
  protected canEditInStatus(status: NewsletterStatus): boolean {
    const capabilities = this.getCapabilities();
    return capabilities.editableStatuses.includes(status);
  }
  
  /**
   * Helper to build pagination response
   */
  protected buildListResponse<T>(
    items: T[],
    total: number,
    options: ListNewsletterOptions = {}
  ): ListNewsletterResponse<T> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    };
  }
}