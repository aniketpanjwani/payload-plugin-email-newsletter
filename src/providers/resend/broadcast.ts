import { Resend } from 'resend'
import type { 
  Broadcast,
  ListBroadcastOptions,
  ListBroadcastResponse,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  SendBroadcastOptions,
  BroadcastAnalytics,
  BroadcastProviderCapabilities,
  Channel,
  CreateChannelInput,
  UpdateChannelInput,
  ListChannelsOptions,
  ListChannelsResponse
} from '../../types'
import { 
  BroadcastProviderError, 
  BroadcastErrorCode,
  BroadcastStatus,
  BaseBroadcastProvider
} from '../../types'
import type { ResendProviderConfig } from '../../types'

/**
 * Resend Broadcast Provider
 * 
 * IMPORTANT LIMITATIONS:
 * - Resend's Broadcast API is not fully documented publicly
 * - Many operations may not be available via API
 * - Broadcasts created via API can only be edited via API (not in dashboard)
 * - Channel management maps to Resend's Audience API
 * - Some methods below are marked as TODO pending official API documentation
 */
export class ResendBroadcastProvider extends BaseBroadcastProvider {
  readonly name = 'resend'
  private client: Resend
  private audienceIds: ResendProviderConfig['audienceIds']
  private isDevelopment: boolean

  constructor(config: ResendProviderConfig) {
    super(config)
    this.client = new Resend(config.apiKey)
    this.audienceIds = config.audienceIds || {}
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    
    if (!config.apiKey) {
      throw new BroadcastProviderError(
        'Resend API key is required',
        BroadcastErrorCode.CONFIGURATION_ERROR,
        this.name
      )
    }
  }

  // Channel Management Methods (map to Resend Audiences)
  async listChannels(options?: ListChannelsOptions): Promise<ListChannelsResponse> {
    try {
      // Resend audiences API
      const response = await this.client.audiences.list()
      
      const channels: Channel[] = response.data?.data?.map(audience => ({
        id: audience.id,
        name: audience.name,
        description: undefined, // Resend doesn't have description
        fromName: (this.config as ResendProviderConfig).fromName || '',
        fromEmail: (this.config as ResendProviderConfig).fromEmail || '',
        replyTo: (this.config as ResendProviderConfig).replyTo,
        providerId: audience.id,
        providerType: 'resend' as const,
        subscriberCount: undefined, // Not available in list API
        active: true,
        createdAt: new Date(audience.created_at),
        updatedAt: new Date(audience.created_at) // No updated_at in Resend
      })) || []
      
      return {
        channels,
        total: channels.length,
        limit: options?.limit || 100,
        offset: options?.offset || 0
      }
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to list channels (audiences): ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async getChannel(id: string): Promise<Channel> {
    try {
      const response = await this.client.audiences.get(id)
      
      if (!response.data) {
        throw new BroadcastProviderError(
          `Channel (audience) not found: ${id}`,
          BroadcastErrorCode.CHANNEL_NOT_FOUND,
          this.name
        )
      }
      
      return {
        id: response.data.id,
        name: response.data.name,
        description: undefined,
        fromName: (this.config as ResendProviderConfig).fromName || '',
        fromEmail: (this.config as ResendProviderConfig).fromEmail || '',
        replyTo: (this.config as ResendProviderConfig).replyTo,
        providerId: response.data.id,
        providerType: 'resend',
        subscriberCount: undefined, // Not available
        active: true,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.created_at)
      }
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to get channel (audience): ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async createChannel(data: CreateChannelInput): Promise<Channel> {
    try {
      const response = await this.client.audiences.create({
        name: data.name
      })
      
      if (!response.data) {
        throw new Error('Failed to create audience')
      }
      
      return {
        id: response.data.id,
        name: response.data.name,
        description: data.description,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyTo: data.replyTo,
        providerId: response.data.id,
        providerType: 'resend',
        subscriberCount: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to create channel (audience): ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async updateChannel(id: string, data: UpdateChannelInput): Promise<Channel> {
    // Resend doesn't support updating audiences via API
    throw new BroadcastProviderError(
      'Updating channels (audiences) is not supported by Resend API',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async deleteChannel(id: string): Promise<void> {
    try {
      await this.client.audiences.remove(id)
    } catch (error: unknown) {
      throw new BroadcastProviderError(
        `Failed to delete channel (audience): ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  // Broadcast Management Methods
  async list(options?: ListBroadcastOptions): Promise<ListBroadcastResponse<Broadcast>> {
    // TODO: Resend broadcast list API is not documented
    // The SDK may have undocumented methods we could explore
    // For now, we throw a not supported error
    throw new BroadcastProviderError(
      'Listing broadcasts is not currently supported by Resend API. ' +
      'This feature may be available in the dashboard only.',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async get(id: string): Promise<Broadcast> {
    // TODO: Resend broadcast get API is not documented
    // We would need to explore if the SDK has undocumented methods
    throw new BroadcastProviderError(
      'Getting individual broadcasts is not currently supported by Resend API. ' +
      'This feature may be available in the dashboard only.',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async create(data: CreateBroadcastInput): Promise<Broadcast> {
    try {
      this.validateRequiredFields(data, ['channelId', 'name', 'subject', 'content'])

      // Get the appropriate audience ID
      const locale = 'en' // TODO: Make this configurable
      const audienceConfig = this.audienceIds?.[locale]
      const audienceId = this.isDevelopment 
        ? audienceConfig?.development || audienceConfig?.production
        : audienceConfig?.production || audienceConfig?.development

      if (!audienceId && data.audienceIds?.length) {
        // Use provided audience ID if no default configured
        // Note: Resend might only support one audience per broadcast
      }

      // TODO: The exact Resend broadcast creation API is not documented
      // Based on their blog posts, it seems broadcasts can be created via API
      // but the exact endpoint/method is unclear
      
      // Attempt to use broadcasts if available in SDK
      const resendClient = this.client as any
      if (resendClient.broadcasts?.create) {
        const broadcast = await resendClient.broadcasts.create({
          name: data.name,
          subject: data.subject,
          from: `${(this.config as ResendProviderConfig).fromName || 'Newsletter'} <${(this.config as ResendProviderConfig).fromEmail || 'noreply@example.com'}>`,
          reply_to: data.replyTo,
          audience_id: audienceId || data.audienceIds?.[0],
          content: {
            html: data.content,
            // TODO: Handle plain text version
          }
        })

        // Transform to our Broadcast type
        return this.transformResendToBroadcast(broadcast)
      }

      // If broadcasts API not available, throw error
      throw new BroadcastProviderError(
        'Creating broadcasts via API is not currently supported. ' +
        'Please check if Resend has released their Broadcasts API.',
        BroadcastErrorCode.NOT_SUPPORTED,
        this.name
      )
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to create broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async update(id: string, data: UpdateBroadcastInput): Promise<Broadcast> {
    // TODO: Resend broadcast update API is not documented
    // Important: Resend has restrictions where broadcasts created via API
    // can only be edited via API (not in dashboard)
    throw new BroadcastProviderError(
      'Updating broadcasts is not currently supported by Resend API. ' +
      'Note: Resend broadcasts can only be edited where they were created.',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async delete(id: string): Promise<void> {
    // TODO: Resend broadcast delete API is not documented
    throw new BroadcastProviderError(
      'Deleting broadcasts is not currently supported by Resend API.',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async send(id: string, options?: SendBroadcastOptions): Promise<Broadcast> {
    try {
      // TODO: The exact Resend broadcast send API is not documented
      // Based on their features, sending broadcasts is supported
      
      const resendClient = this.client as any
      if (resendClient.broadcasts?.send) {
        await resendClient.broadcasts.send(id, {
          audience_id: options?.audienceIds?.[0],
          // TODO: Handle test mode if supported
        })

        // We can't get the updated broadcast, so return a mock
        return {
          id,
          channelId: options?.audienceIds?.[0] || '1',
          name: 'Unknown',
          subject: 'Unknown',
          content: '',
          status: BroadcastStatus.SENDING,
          trackOpens: true,
          trackClicks: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          providerType: 'resend'
        } as Broadcast
      }

      throw new BroadcastProviderError(
        'Sending broadcasts via API is not currently supported. ' +
        'Please check if Resend has released their Broadcasts API.',
        BroadcastErrorCode.NOT_SUPPORTED,
        this.name
      )
    } catch (error: unknown) {
      if (error instanceof BroadcastProviderError) throw error
      
      throw new BroadcastProviderError(
        `Failed to send broadcast: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BroadcastErrorCode.PROVIDER_ERROR,
        this.name,
        error
      )
    }
  }

  async schedule(id: string, scheduledAt: Date): Promise<Broadcast> {
    // Scheduling is not supported according to our research
    throw new BroadcastProviderError(
      'Scheduling broadcasts is not supported by Resend',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  async getAnalytics(id: string): Promise<BroadcastAnalytics> {
    // TODO: Resend does support analytics, but the API is not documented
    // They have dashboard analytics for broadcasts
    throw new BroadcastProviderError(
      'Getting broadcast analytics via API is not currently supported. ' +
      'Analytics may be available in the Resend dashboard.',
      BroadcastErrorCode.NOT_SUPPORTED,
      this.name
    )
  }

  getCapabilities(): BroadcastProviderCapabilities {
    return {
      supportsScheduling: false, // Not documented
      supportsSegmentation: true, // Via Audiences
      supportsAnalytics: true, // Available in dashboard, API unclear
      supportsABTesting: false,
      supportsTemplates: false, // Not clear from docs
      supportsPersonalization: true, // Via merge tags
      supportsMultipleChannels: true, // Via multiple audiences
      supportsChannelSegmentation: false, // Not within a single audience
      editableStatuses: [], // Unclear which statuses can be edited
      supportedContentTypes: ['html'] // React components via SDK
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      // Try to use the API key to validate it works
      // We can try to list audiences as a validation check
      const resendClient = this.client as any
      if (resendClient.audiences?.list) {
        await resendClient.audiences.list({ limit: 1 })
        return true
      }
      
      // Fallback: try to send a test email to validate API key
      await this.client.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev',
        subject: 'Configuration Test',
        html: '<p>Testing configuration</p>'
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Transform Resend broadcast to our Broadcast type
   * NOTE: This is speculative based on what the API might return
   */
  private transformResendToBroadcast(broadcast: any): Broadcast {
    return {
      id: broadcast.id,
      channelId: broadcast.audience_id || '1', // Map audience_id to channelId
      name: broadcast.name || 'Untitled',
      subject: broadcast.subject,
      preheader: broadcast.preheader,
      content: broadcast.content?.html || broadcast.html || '',
      status: this.mapResendStatus(broadcast.status),
      trackOpens: true, // Resend tracks by default
      trackClicks: true, // Resend tracks by default
      replyTo: broadcast.reply_to,
      recipientCount: broadcast.recipient_count,
      sentAt: broadcast.sent_at ? new Date(broadcast.sent_at) : undefined,
      scheduledAt: broadcast.scheduled_at ? new Date(broadcast.scheduled_at) : undefined,
      createdAt: new Date(broadcast.created_at || Date.now()),
      updatedAt: new Date(broadcast.updated_at || Date.now()),
      providerData: { broadcast },
      providerId: broadcast.id,
      providerType: 'resend'
    }
  }

  private mapResendStatus(status?: string): BroadcastStatus {
    if (!status) return BroadcastStatus.DRAFT
    
    // NOTE: Resend statuses are not documented, these are guesses
    const statusMap: Record<string, BroadcastStatus> = {
      'draft': BroadcastStatus.DRAFT,
      'scheduled': BroadcastStatus.SCHEDULED,
      'sending': BroadcastStatus.SENDING,
      'sent': BroadcastStatus.SENT,
      'failed': BroadcastStatus.FAILED
    }
    return statusMap[status.toLowerCase()] || BroadcastStatus.DRAFT
  }
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Most methods throw NOT_SUPPORTED errors because Resend's Broadcast API
 *    is not publicly documented
 * 
 * 2. The SDK might have undocumented methods (broadcasts.create, broadcasts.send, etc.)
 *    that we attempt to use, but we can't guarantee they exist
 * 
 * 3. Important limitation: Broadcasts created via API can only be edited via API,
 *    not in the Resend dashboard
 * 
 * 4. Resend uses "Audiences" instead of "Segments" for targeting
 * 
 * 5. Analytics are available in the dashboard but API access is unclear
 * 
 * FUTURE IMPROVEMENTS:
 * - Monitor Resend's documentation for Broadcast API updates
 * - Explore SDK source code for undocumented methods
 * - Consider using Resend's email API to simulate broadcasts
 * - Add webhook support for delivery/open/click tracking
 */